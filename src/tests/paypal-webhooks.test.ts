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
  let subUpdate: Mock;
  let subEq: Mock;
  
  // Mocks for 'stores' table
  let storeUpdate: Mock;
  let storeEq: Mock;

  // A generic 'from' mock to route to the correct table mocks
  let mockFrom: Mock;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup individual mock chains for each table
    subEq = vi.fn().mockResolvedValue({ error: null });
    subUpdate = vi.fn().mockReturnValue({ eq: subEq });

    storeEq = vi.fn().mockResolvedValue({ error: null });
    storeUpdate = vi.fn().mockReturnValue({ eq: storeEq });
    
    // The rpc mock is simpler
    mockRpc = vi.fn().mockResolvedValue({ data: mockUserId, error: null });

    // The 'from' mock now acts as a router based on the table name
    mockFrom = vi.fn().mockImplementation((tableName: string) => {
      if (tableName === 'subscriptions') {
        return { update: subUpdate };
      }
      if (tableName === 'stores') {
        return { update: storeUpdate };
      }
      // Return a default empty mock to avoid errors on unexpected calls
      return { update: vi.fn().mockReturnValue({ eq: vi.fn() }) };
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
    expect(subUpdate).toHaveBeenCalledWith({
      status: 'cancelled',
      cancelled_at: mockEvent.resource.status_update_time,
    });
    expect(subEq).toHaveBeenCalledWith('provider_subscription_id', mockSubscriptionId);
  });

  it('debería actualizar el estado a "suspended" para BILLING.SUBSCRIPTION.SUSPENDED', async () => {
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
    
    // Verify the call to 'subscriptions' table
    expect(mockFrom).toHaveBeenCalledWith('subscriptions');
    expect(subUpdate).toHaveBeenCalledWith({
      provider_plan_id: newPlanId,
      status: 'active',
      current_period_end: mockEvent.resource.billing_info.next_billing_time,
    });
    expect(subEq).toHaveBeenCalledWith('provider_subscription_id', mockSubscriptionId);

    // Verify the call to 'stores' table
    expect(mockFrom).toHaveBeenCalledWith('stores');
    expect(storeUpdate).toHaveBeenCalledWith({ plan_type: 'full' });
    expect(storeEq).toHaveBeenCalledWith('user_id', mockUserId);

    // Ensure no cross-contamination
    expect(storeUpdate).not.toHaveBeenCalledWith(expect.objectContaining({ status: 'active' }));
    expect(subUpdate).not.toHaveBeenCalledWith(expect.objectContaining({ plan_type: 'full' }));
  });
});
