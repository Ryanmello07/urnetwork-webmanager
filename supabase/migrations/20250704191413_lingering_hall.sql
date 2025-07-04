/*
  # Create wallet stats tracking system

  1. New Tables
    - `wallet_stats`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user)
      - `network_name` (text, user's network name)
      - `paid_bytes_provided` (bigint)
      - `unpaid_bytes_provided` (bigint)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `wallet_stats` table
    - Add policy for authenticated users to read/write their own data

  3. Indexes
    - Add index on user_id for faster queries
    - Add index on created_at for time-based queries
*/

CREATE TABLE IF NOT EXISTS wallet_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  network_name text NOT NULL,
  paid_bytes_provided bigint NOT NULL DEFAULT 0,
  unpaid_bytes_provided bigint NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE wallet_stats ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wallet_stats_user_id ON wallet_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_stats_created_at ON wallet_stats(created_at);
CREATE INDEX IF NOT EXISTS idx_wallet_stats_user_time ON wallet_stats(user_id, created_at);

-- RLS Policies
CREATE POLICY "Users can read own wallet stats"
  ON wallet_stats
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own wallet stats"
  ON wallet_stats
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own wallet stats"
  ON wallet_stats
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id::text);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_wallet_stats_updated_at
  BEFORE UPDATE ON wallet_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();