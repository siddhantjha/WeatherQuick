-- Enable Row Level Security for all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Profiles table policies
-- Users can read their own profile
CREATE POLICY profiles_read_own ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Locations table policies
-- Users can read their own locations
CREATE POLICY locations_read_own ON locations
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own locations
CREATE POLICY locations_insert_own ON locations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own locations
CREATE POLICY locations_update_own ON locations
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own locations
CREATE POLICY locations_delete_own ON locations
  FOR DELETE USING (auth.uid() = user_id);

-- Weather alerts table policies
-- Users can read their own alerts
CREATE POLICY weather_alerts_read_own ON weather_alerts
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own alerts
CREATE POLICY weather_alerts_insert_own ON weather_alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own alerts
CREATE POLICY weather_alerts_update_own ON weather_alerts
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own alerts
CREATE POLICY weather_alerts_delete_own ON weather_alerts
  FOR DELETE USING (auth.uid() = user_id);

-- User settings table policies
-- Users can read their own settings
CREATE POLICY user_settings_read_own ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own settings
CREATE POLICY user_settings_update_own ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Create a policy to verify the location belongs to the user when creating alerts
CREATE POLICY weather_alerts_location_check ON weather_alerts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM locations
      WHERE locations.id = location_id 
      AND locations.user_id = auth.uid()
    )
  );

-- Create a policy to verify the location belongs to the user when updating alerts
CREATE POLICY weather_alerts_location_update_check ON weather_alerts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM locations
      WHERE locations.id = location_id 
      AND locations.user_id = auth.uid()
    )
  );

-- Allow service role to access all tables (for admin purposes)
CREATE POLICY service_role_access_all ON profiles
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
  
CREATE POLICY service_role_access_all ON locations
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
  
CREATE POLICY service_role_access_all ON weather_alerts
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
  
CREATE POLICY service_role_access_all ON user_settings
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role'); 