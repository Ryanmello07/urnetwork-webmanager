import pg from 'pg';

const { Pool } = pg;

// Database configuration
const pool = new Pool({
  connectionString: import.meta.env.VITE_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
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
    const query = `
      INSERT INTO wallet_stats (user_id, network_name, paid_bytes_provided, unpaid_bytes_provided)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const result = await pool.query(query, [userId, networkName, paidBytes, unpaidBytes]);
    return { data: result.rows[0] || null, error: null };
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
    const query = `
      SELECT * FROM wallet_stats 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `;
    
    const result = await pool.query(query, [userId, limit]);
    return { data: result.rows, error: null };
  } catch (error) {
    console.error('Error fetching wallet stats history:', error);
    return { data: null, error };
  }
};

export const getLatestWalletStats = async (
  userId: string
): Promise<{ data: WalletStatsRecord | null; error: any }> => {
  try {
    const query = `
      SELECT * FROM wallet_stats 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    const result = await pool.query(query, [userId]);
    return { data: result.rows[0] || null, error: null };
  } catch (error) {
    console.error('Error fetching latest wallet stats:', error);
    return { data: null, error };
  }
};

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Database connection successful:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};

// Close database connection
export const closeConnection = async (): Promise<void> => {
  try {
    await pool.end();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
};