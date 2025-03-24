-- Create tables for recommendation system

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preference_key TEXT NOT NULL, 
  preference_value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Make user_id and preference_key a unique pair
  UNIQUE(user_id, preference_key)
);

-- Create recommendation history table
CREATE TABLE IF NOT EXISTS recommendation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_id TEXT NOT NULL,
  recommendation_type TEXT NOT NULL,
  location_id TEXT NOT NULL,
  weather_condition TEXT NOT NULL,
  temperature DECIMAL NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  feedback BOOLEAN
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_prefs_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_rec_history_user_id ON recommendation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_rec_history_recommendation_id ON recommendation_history(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_rec_history_timestamp ON recommendation_history(timestamp);

-- RLS Policies

-- Enable RLS on both tables
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_history ENABLE ROW LEVEL SECURITY;

-- User Preferences Policies

-- Users can view their own preferences
CREATE POLICY user_prefs_select_policy ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY user_prefs_insert_policy ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY user_prefs_update_policy ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own preferences
CREATE POLICY user_prefs_delete_policy ON user_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- Recommendation History Policies

-- Users can view their own recommendation history
CREATE POLICY rec_history_select_policy ON recommendation_history
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own recommendation history
CREATE POLICY rec_history_insert_policy ON recommendation_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own recommendation history (for adding feedback)
CREATE POLICY rec_history_update_policy ON recommendation_history
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own recommendation history
CREATE POLICY rec_history_delete_policy ON recommendation_history
  FOR DELETE USING (auth.uid() = user_id);

-- Create a function to clean up old recommendation history (older than 30 days)
CREATE OR REPLACE FUNCTION clean_recommendation_history() RETURNS void AS $$
BEGIN
  DELETE FROM recommendation_history
  WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Create a weekly scheduled job to clean old recommendation history
-- Note: This requires pg_cron extension to be installed and enabled
-- If pg_cron is not available, this can be done through application logic instead
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    SELECT cron.schedule('0 0 * * 0', 'SELECT clean_recommendation_history()');
  END IF;
END
$$; 