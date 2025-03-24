-- Create user_preferences table for storing user activity and preference data
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  preference_type TEXT NOT NULL, -- 'activity', 'clothing', 'transportation', etc.
  preference_value TEXT NOT NULL, -- The actual preference value
  importance INTEGER DEFAULT 3 NOT NULL, -- Scale from 1-5 where 5 is most important
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  -- Ensure unique preference types per user
  CONSTRAINT user_preferences_unique UNIQUE (user_id, preference_type, preference_value)
);

-- Create recommendation_history table for tracking recommendations shown to users
CREATE TABLE IF NOT EXISTS recommendation_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  location_id UUID REFERENCES locations ON DELETE CASCADE NOT NULL,
  recommendation_type TEXT NOT NULL, -- 'activity', 'clothing', 'transportation', 'alert', etc.
  recommendation_text TEXT NOT NULL,
  weather_condition TEXT NOT NULL, -- The weather condition at the time of recommendation
  temperature NUMERIC NOT NULL, -- The temperature at the time of recommendation
  was_helpful BOOLEAN, -- User feedback on whether the recommendation was helpful
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_feedback table for tracking user feedback on recommendations
CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  recommendation_id UUID REFERENCES recommendation_history ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL, -- 1-5 rating
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add trigger to update the updated_at column for user_preferences
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON user_preferences
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Add Row Level Security (RLS) policies
-- Enable RLS on the tables
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies to restrict access to the user's own data
CREATE POLICY user_preferences_policy ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY recommendation_history_policy ON recommendation_history
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY user_feedback_policy ON user_feedback
  FOR ALL USING (auth.uid() = user_id);

-- Create functions for recommendations

-- Function to get user's preferences
CREATE OR REPLACE FUNCTION get_user_preferences(p_user_id UUID)
RETURNS TABLE (
  preference_type TEXT,
  preference_value TEXT,
  importance INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT up.preference_type, up.preference_value, up.importance
  FROM user_preferences up
  WHERE up.user_id = p_user_id
  ORDER BY up.importance DESC, up.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record a recommendation
CREATE OR REPLACE FUNCTION record_recommendation(
  p_user_id UUID,
  p_location_id UUID,
  p_recommendation_type TEXT,
  p_recommendation_text TEXT,
  p_weather_condition TEXT,
  p_temperature NUMERIC
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO recommendation_history (
    user_id, location_id, recommendation_type, recommendation_text, 
    weather_condition, temperature
  ) VALUES (
    p_user_id, p_location_id, p_recommendation_type, p_recommendation_text, 
    p_weather_condition, p_temperature
  ) RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record user feedback
CREATE OR REPLACE FUNCTION record_recommendation_feedback(
  p_user_id UUID,
  p_recommendation_id UUID,
  p_was_helpful BOOLEAN
)
RETURNS VOID AS $$
BEGIN
  -- Update the recommendation history
  UPDATE recommendation_history
  SET was_helpful = p_was_helpful
  WHERE id = p_recommendation_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 