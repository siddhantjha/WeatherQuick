-- Function to update location positions in a batch operation
CREATE OR REPLACE FUNCTION update_location_positions(
  user_id_param UUID,
  location_ids UUID[]
)
RETURNS VOID AS $$
DECLARE
  i INTEGER;
  loc_id UUID;
BEGIN
  -- Ensure all locations belong to the user
  IF EXISTS (
    SELECT 1
    FROM locations l
    WHERE l.user_id != user_id_param 
    AND l.id = ANY(location_ids)
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Cannot update locations that do not belong to the user';
  END IF;

  -- Update positions based on the array order
  i := 0;
  FOREACH loc_id IN ARRAY location_ids
  LOOP
    UPDATE locations
    SET position = i
    WHERE id = loc_id AND user_id = user_id_param;
    
    i := i + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 