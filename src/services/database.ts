// Direct PostgreSQL connection for wallet stats
// Note: This runs in the browser, so we'll use a simple fetch-based approach
// to avoid Node.js-specific dependencies like 'pg'

export interface WalletStatsRecord {
  id: string;
  user_id: string;
  network_name: string;
  paid_bytes_provided: number;
  unpaid_bytes_provided: number;
  created_at: string;
  updated_at: string;
}

// Simple database operations using fetch to a backend endpoint
// Since we can't use pg directly in the browser, we'll create a simple API layer

const DB_API_BASE = env.DB_API_BASE;

export const saveWalletStats = async (
  userId: string,
  networkName: string,
  paidBytes: number,
  unpaidBytes: number
): Promise<{ data: WalletStatsRecord | null; error: any }> => {
  try {
    const response = await fetch(`${DB_API_BASE}/wallet-stats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        network_name: networkName,
        paid_bytes_provided: paidBytes,
        unpaid_bytes_provided: unpaidBytes
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { data, error: null };
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
    const response = await fetch(`${DB_API_BASE}/wallet-stats/${userId}?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching wallet stats history:', error);
    return { data: null, error };
  }
};

export const getLatestWalletStats = async (
  userId: string
): Promise<{ data: WalletStatsRecord | null; error: any }> => {
  try {
    const response = await fetch(`${DB_API_BASE}/wallet-stats/${userId}/latest`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching latest wallet stats:', error);
    return { data: null, error };
  }
};

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${DB_API_BASE}/test`, {
      method: 'GET',
    });

    if (!response.ok) {
      console.error('Database connection failed:', response.status);
      return false;
    }

    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};

// Close database connection (not needed for fetch-based approach)
export const closeConnection = async (): Promise<void> => {
  console.log('Database connection closed (no action needed for fetch-based approach)');
};