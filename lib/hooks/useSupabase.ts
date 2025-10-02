"use client";

import { useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';

// Singleton instance for browser client
let browserClient: SupabaseClient<Database> | null = null;

/**
 * Hook to get a singleton Supabase browser client instance
 * This prevents creating multiple clients and ensures consistent auth state
 */
export function useSupabase() {
  const supabase = useMemo(() => {
    if (!browserClient) {
      browserClient = createClient();
    }
    return browserClient;
  }, []);

  return supabase;
}

/**
 * Get the Supabase client directly (for use outside React components)
 * @returns Singleton Supabase browser client
 */
export function getSupabaseClient() {
  if (!browserClient) {
    browserClient = createClient();
  }
  return browserClient;
}
