// src/features/auth/services/authService.test.ts
import { describe, it, expect, vi } from 'vitest';
import { signUp, signIn, signOut } from './authService';
import { supabase } from '../../../lib/supabaseClient';

vi.mock('../../../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

describe('authService', () => {
  describe('signUp', () => {
    it('should call supabase.auth.signUp with the correct credentials', async () => {
      const credentials = { email: 'test@example.com', password: 'password123' };
      
      const mockResponse = { data: { user: { id: '123' } }, error: null };
      vi.mocked(supabase.auth.signUp).mockResolvedValue(mockResponse as any) // eslint-disable-line @typescript-eslint/no-explicit-any

      await signUp(credentials);

      expect(supabase.auth.signUp).toHaveBeenCalledWith(credentials);
    });

    it('should return the user on successful sign up', async () => {
      const credentials = { email: 'test@example.com', password: 'password123' };
      const mockUser = { id: '123', email: 'test@example.com' };
      const mockResponse = { data: { user: mockUser }, error: null };
      vi.mocked(supabase.auth.signUp).mockResolvedValue(mockResponse as any) // eslint-disable-line @typescript-eslint/no-explicit-any

      const { user, error } = await signUp(credentials);

      expect(user).toEqual(mockUser);
      expect(error).toBeNull();
    });

    it('should return an error on failed sign up', async () => {
      const credentials = { email: 'test@example.com', password: 'password123' };
      const mockError = { message: 'User already registered', status: 400 };
      const mockResponse = { data: { user: null }, error: mockError };
      vi.mocked(supabase.auth.signUp).mockResolvedValue(mockResponse as any) // eslint-disable-line @typescript-eslint/no-explicit-any

      const { user, error } = await signUp(credentials);

      expect(user).toBeNull();
      expect(error).toEqual(mockError);
    });
  });

  describe('signIn', () => {
    it('should call supabase.auth.signInWithPassword with the correct credentials', async () => {
      const credentials = { email: 'test@example.com', password: 'password123' };
      
      const mockResponse = { data: { user: { id: '123' } }, error: null };
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue(mockResponse as any) // eslint-disable-line @typescript-eslint/no-explicit-any

      await signIn(credentials);

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith(credentials);
    });

    it('should return the user on successful sign in', async () => {
      const credentials = { email: 'test@example.com', password: 'password123' };
      const mockUser = { id: '123', email: 'test@example.com' };
      const mockResponse = { data: { user: mockUser }, error: null };
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue(mockResponse as any) // eslint-disable-line @typescript-eslint/no-explicit-any

      const { user, error } = await signIn(credentials);

      expect(user).toEqual(mockUser);
      expect(error).toBeNull();
    });

    it('should return an error on failed sign in', async () => {
      const credentials = { email: 'test@example.com', password: 'password123' };
      const mockError = { message: 'Invalid credentials', status: 400 };
      const mockResponse = { data: { user: null }, error: mockError };
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue(mockResponse as any) // eslint-disable-line @typescript-eslint/no-explicit-any

      const { user, error } = await signIn(credentials);

      expect(user).toBeNull();
      expect(error).toEqual(mockError);
    });
  });

  describe('signOut', () => {
    it('should call supabase.auth.signOut', async () => {
      const mockResponse = { error: null };
      vi.mocked(supabase.auth.signOut).mockResolvedValue(mockResponse as any) // eslint-disable-line @typescript-eslint/no-explicit-any

      await signOut();

      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('should return no error on successful sign out', async () => {
      const mockResponse = { error: null };
      vi.mocked(supabase.auth.signOut).mockResolvedValue(mockResponse as any) // eslint-disable-line @typescript-eslint/no-explicit-any

      const { error } = await signOut();

      expect(error).toBeNull();
    });

    it('should return an error on failed sign out', async () => {
      const mockError = { message: 'Sign out failed', status: 500 };
      const mockResponse = { error: mockError };
      vi.mocked(supabase.auth.signOut).mockResolvedValue(mockResponse as any) // eslint-disable-line @typescript-eslint/no-explicit-any

      const { error } = await signOut();

      expect(error).toEqual(mockError);
    });
  });
});
