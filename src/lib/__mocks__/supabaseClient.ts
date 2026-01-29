// src/lib/__mocks__/supabaseClient.ts
import { mockSupabase } from '../../__mocks__/supabase';

// Export the centralized mock.
// Vitest will automatically pick this up when vi.mock('../lib/supabaseClient') is called.
export const supabase = mockSupabase;