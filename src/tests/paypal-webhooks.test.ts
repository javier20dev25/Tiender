// src/tests/paypal-webhooks.test.ts
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { processWebhookEvent, PlanMap } from '../../supabase/functions/handle-paypal-webhook/logic';

vi.mock('@supabase/supabase-js');

// Test data
const mockUserId = 'user-123';
const mockSubscriberEmail = 'test@example.com';
const mockSubscriptionId = 'paypal-sub-id-1';

describe('Lógica del Webhook de PayPal', () => {
  let mockSupabaseAdmin: any;
  let mockRpc: Mock;
  let mockPlanMap: PlanMap;

  // Mocks for 'subscriptions' table
  let subUpdate: Mock, subEq: Mock, subSelect: Mock, subSelectEq: Mock, subSingle: Mock;
  
  // Mocks for 'stores' table
  let storeUpdate: Mock, storeEq: Mock;

  let mockFrom: Mock;

  beforeEach(() => {
    vi.clearAllMocks();

    // --- Mock chain for 'subscriptions' table ---
    // .update().eq()
    subEq = vi.fn().mockResolvedValue({ error: null });
    subUpdate = vi.fn().mockReturnValue({ eq: subEq });
    // .select().eq().single()
    subSingle = vi.fn().mockResolvedValue({ data: { status: 'active' }, error: null });
    subSelectEq = vi.fn().mockReturnValue({ single: subSingle });
    subSelect = vi.fn().mockReturnValue({ eq: subSelectEq });

    // --- Mock chain for 'stores' table ---
    storeEq = vi.fn().mockResolvedValue({ error: null });
    storeUpdate = vi.fn().mockReturnValue({ eq: storeEq });
    
    mockRpc = vi.fn().mockResolvedValue({ data: mockUserId, error: null });

    // The 'from' mock acts as a router based on the table name
    mockFrom = vi.fn().mockImplementation((tableName: string) => {
      if (tableName === 'subscriptions') {
        return { update: subUpdate, select: subSelect };
      }
      if (tableName === 'stores') {
        return { update: storeUpdate };
      }
      return { update: vi.fn().mockReturnValue({ eq: vi.fn() }), select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn() }) }) };
    });

    mockSupabaseAdmin = {
      from: mockFrom,
      rpc: mockRpc,
    };

    (createClient as any).mockReturnValue(mockSupabaseAdmin);
    
    mockPlanMap = {
      'P-12345STD': 'standard',
      'P-67890FULL': 'full',
    };
  });

  it('debería actualizar el estado a "cancelled" para BILLING.SUBSCRIPTION.CANCELLED', async () => {
    const mockEvent = {
      id: 'evt-1',
      event_type: 'BILLING.SUBSCRIPTION.CANCELLED',
      resource: {
        id: mockSubscriptionId,
        status: 'CANCELLED',
        status_update_time: new Date().toISOString(),
        subscriber: { email_address: mockSubscriberEmail },
      },
    };

    await processWebhookEvent(mockEvent as any, mockSupabaseAdmin, mockPlanMap);

    expect(mockRpc).toHaveBeenCalledWith('get_user_id_by_email', { user_email: mockSubscriberEmail });
    expect(mockFrom).toHaveBeenCalledWith('subscriptions');
    // Verify the idempotency check was performed
    expect(subSelect).toHaveBeenCalledWith('status');
    expect(subSelectEq).toHaveBeenCalledWith('provider_subscription_id', mockSubscriptionId);
    // Verify the update was performed
    expect(subUpdate).toHaveBeenCalledWith({
      status: 'cancelled',
      cancelled_at: mockEvent.resource.status_update_time,
    });
    expect(subEq).toHaveBeenCalledWith('provider_subscription_id', mockSubscriptionId);
  });

  it('debería actualizar el estado a "suspended" (sin chequeo de idempotencia aún)', async () => {
    const mockEvent = {
      id: 'evt-2',
      event_type: 'BILLING.SUBSCRIPTION.SUSPENDED',
      resource: {
        id: mockSubscriptionId,
        subscriber: { email_address: mockSubscriberEmail },
      },
    };

    await processWebhookEvent(mockEvent as any, mockSupabaseAdmin, mockPlanMap);

    expect(mockFrom).toHaveBeenCalledWith('subscriptions');
    expect(subUpdate).toHaveBeenCalledWith({ status: 'suspended' });
    expect(subEq).toHaveBeenCalledWith('provider_subscription_id', mockSubscriptionId);
  });

  it('debería actualizar el plan en la tienda y suscripción para BILLING.SUBSCRIPTION.UPDATED', async () => {
    const newPlanId = 'P-67890FULL';
    const mockEvent = {
      id: 'evt-3',
      event_type: 'BILLING.SUBSCRIPTION.UPDATED',
      resource: {
        id: mockSubscriptionId,
        status: 'ACTIVE',
        plan_id: newPlanId,
        billing_info: { next_billing_time: new Date().toISOString() },
        subscriber: { email_address: mockSubscriberEmail },
      },
    };

    await processWebhookEvent(mockEvent as any, mockSupabaseAdmin, mockPlanMap);
    
    expect(mockFrom).toHaveBeenCalledWith('subscriptions');
    expect(subUpdate).toHaveBeenCalledWith({
      provider_plan_id: newPlanId,
      status: 'active',
      current_period_end: mockEvent.resource.billing_info.next_billing_time,
    });
    expect(subEq).toHaveBeenCalledWith('provider_subscription_id', mockSubscriptionId);

    expect(mockFrom).toHaveBeenCalledWith('stores');
    expect(storeUpdate).toHaveBeenCalledWith({ plan_type: 'full' });
    expect(storeEq).toHaveBeenCalledWith('user_id', mockUserId);
  });

  it('debería ser idempotente y no procesar el mismo evento de cancelación dos veces', async () => {
    const mockEvent = {
      id: 'evt-cancel-idem',
      event_type: 'BILLING.SUBSCRIPTION.CANCELLED',
      resource: {
        id: mockSubscriptionId,
        status: 'CANCELLED',
        status_update_time: new Date().toISOString(),
        subscriber: { email_address: mockSubscriberEmail },
      },
    };

    // Simulate the state change for the idempotency check
    subSingle
      .mockResolvedValueOnce({ data: { status: 'active' }, error: null }) // 1st call, sub is active
      .mockResolvedValueOnce({ data: { status: 'cancelled' }, error: null });// 2nd call, sub is already cancelled

    // Call the event handler twice with the same event
    await processWebhookEvent(mockEvent as any, mockSupabaseAdmin, mockPlanMap);
    await processWebhookEvent(mockEvent as any, mockSupabaseAdmin, mockPlanMap);

    expect(mockRpc).toHaveBeenCalledTimes(2);
    // The select call should happen twice
    expect(subSelect).toHaveBeenCalledTimes(2);
    // However, the database update should only happen ONCE
    expect(subUpdate).toHaveBeenCalledTimes(1);
    expect(subEq).toHaveBeenCalledTimes(1);
  });
});
