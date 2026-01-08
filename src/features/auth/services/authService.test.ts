// src/features/auth/services/authService.test.ts
import { describe, it, expect, vi } from 'vitest';
import { signUp } from './authService';
import { supabase } from '../../../lib/supabaseClient';

vi.mock('../../../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
    },
  },
}));

describe('authService', () => {
  it('should call supabase.auth.signUp with the correct credentials', async () => {
    const credentials = { email: 'test@example.com', password: 'password123' };
    
    // Mock the response from supabase.auth.signUp
    const mockResponse = { data: { user: { id: '123' } }, error: null };
    vi.mocked(supabase.auth.signUp).mockResolvedValue(mockResponse as any);

    await signUp(credentials);

    expect(supabase.auth.signUp).toHaveBeenCalledWith(credentials);
  });

  it('should return the user on successful sign up', async () => {
    const credentials = { email: 'test@example.com', password: 'password123' };
    const mockUser = { id: '123', email: 'test@example.com' };
    const mockResponse = { data: { user: mockUser }, error: null };
    vi.mocked(supabase.auth.signUp).mockResolvedValue(mockResponse as any);

    const { user, error } = await signUp(credentials);

    expect(user).toEqual(mockUser);
    expect(error).toBeNull();
  });

  it('should return an error on failed sign up', async () => {
    const credentials = { email: 'test@example.com', password: 'password123' };
    const mockError = { message: 'User already registered', status: 400 };
    const mockResponse = { data: { user: null }, error: mockError };
    vi.mocked(supabase.auth.signUp).mockResolvedValue(mockResponse as any);

    const { user, error } = await signUp(credentials);

    expect(user).toBeNull();
    expect(error).toEqual(mockError);
  });
});
