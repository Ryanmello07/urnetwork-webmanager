import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Initialize anonymous session - MUST be called when app starts
export const initializeApp = async () => {
  try {
    // First check if we already have a session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // Sign in anonymously if no session exists
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      console.log('Anonymous session initialized');
      return data;
    }
    
    return session;
  } catch (error) {
    console.error('Failed to initialize app:', error);
    throw error;
  }
};

export interface WalletStatsRecord {
  id: string;
  user_id: string;
  network_name: string;
  paid_bytes_provided: number;
  unpaid_bytes_provided: number;
  created_at: string;
  updated_at: string;
}

export const saveWalletStats = async (
  userId: string,
  networkName: string,
  paidBytes: number,
  unpaidBytes: number
): Promise<{ data: WalletStatsRecord | null; error: any }> => {
  try {
    // Ensure we have a session before making the request
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      await initializeApp();
    }

    const { data, error } = await supabase
      .from('wallet_stats')
      .insert({
        user_id: userId,
        network_name: networkName,
        paid_bytes_provided: paidBytes,
        unpaid_bytes_provided: unpaidBytes,
      })
      .select()
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error saving wallet stats:', error);
    return { data: null, error };
  }
};

export const getWalletStatsHistory = async (
  userId: string,
  limit: number = 100
): Promise<{ data: WalletStatsRecord[] | null; error: any }> => {
  try {
    // Ensure we have a session before making the request
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      await initializeApp();
    }

    const { data, error } = await supabase
      .from('wallet_stats')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return { data, error };
  } catch (error) {
    console.error('Error fetching wallet stats history:', error);
    return { data: null, error };
  }
};

export const getLatestWalletStats = async (
  userId: string
): Promise<{ data: WalletStatsRecord | null; error: any }> => {
  try {
    // Ensure we have a session before making the request
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      await initializeApp();
    }

    const { data, error } = await supabase
      .from('wallet_stats')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(); // Use maybeSingle() to handle no results gracefully

    return { data, error };
  } catch (error) {
    console.error('Error fetching latest wallet stats:', error);
    return { data: null, error };
  }
};

// Alternative: Direct API approach if anonymous auth doesn't work
export const saveWalletStatsDirect = async (
  userId: string,
  networkName: string,
  paidBytes: number,
  unpaidBytes: number
): Promise<{ data: WalletStatsRecord | null; error: any }> => {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/wallet_stats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        user_id: userId,
        network_name: networkName,
        paid_bytes_provided: paidBytes,
        unpaid_bytes_provided: unpaidBytes,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    return { data: data[0] || null, error: null };
  } catch (error) {
    console.error('Error saving wallet stats directly:', error);
    return { data: null, error };
  }
};

// Helper function to check current auth status
export const checkAuthStatus = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  console.log('Current auth status:', { 
    hasSession: !!session, 
    userId: session?.user?.id,
    error 
  });
  return { session, error };
};

/* 
USAGE EXAMPLE:

// In your app initialization (e.g., App.tsx or main.tsx):
import { initializeApp } from './path-to-this-file';

// Initialize once when app starts
await initializeApp();

// Then use the functions normally:
const result = await saveWalletStats('user123', 'network1', 1000, 500);

// If anonymous auth is not enabled, use the direct method:
const result = await saveWalletStatsDirect('user123', 'network1', 1000, 500);
*/
