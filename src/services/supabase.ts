import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Custom fetch function that adds Authorization header from localStorage
const customFetch = (url: RequestInfo | URL, options: RequestInit = {}) => {
  const byToken = localStorage.getItem('byToken');
  
  if (byToken) {
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${byToken}`,
    };
  }
  
  return fetch(url, options);
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: customFetch,
  },
});

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
    const { data, error } = await supabase
      .from('wallet_stats')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error fetching latest wallet stats:', error);
    return { data: null, error };
  }
};