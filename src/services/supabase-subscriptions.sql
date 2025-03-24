-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tier TEXT NOT NULL DEFAULT 'free',
  period TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  receipt_data TEXT,
  platform TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add is_premium column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

-- Add RLS policies for the user_subscriptions table
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only view their own subscriptions
CREATE POLICY user_subscriptions_select_policy
  ON user_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own subscriptions (although this should typically be done by the server)
CREATE POLICY user_subscriptions_insert_policy
  ON user_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can't update or delete their subscriptions directly
-- This would be handled by server-side functions or admin users

-- Allow service role to access all subscription data
CREATE POLICY service_role_policy
  ON user_subscriptions
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Create a function to check if a user is premium
CREATE OR REPLACE FUNCTION is_user_premium(user_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_active_subscription BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1
    FROM user_subscriptions
    WHERE user_id = user_id_param
    AND tier = 'premium'
    AND status = 'active'
    AND (end_date IS NULL OR end_date > NOW())
  ) INTO has_active_subscription;
  
  RETURN has_active_subscription;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to update the user's premium status
CREATE OR REPLACE FUNCTION update_user_premium_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET is_premium = (
    SELECT is_user_premium(NEW.user_id)
  )
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update premium status when a subscription is inserted or updated
CREATE TRIGGER update_premium_status_trigger
AFTER INSERT OR UPDATE ON user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_user_premium_status();

-- Trigger to update the updated_at timestamp
CREATE TRIGGER set_updated_at_timestamp
BEFORE UPDATE ON user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_modified_column(); 