import { supabase } from './config';
import { User } from '@supabase/supabase-js';

// Define types for database operations
export type UserProfile = {
  id: string;
  display_name: string;
  preferences: Record<string, any>;
};

export type UserLocation = {
  id?: string;
  user_id: string;
  name: string;
  latitude: number;
  longitude: number;
  is_default?: boolean;
  position: number;
};

export type UserSubscription = {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'canceled' | 'expired';
  starts_at: string;
  ends_at: string;
};

interface LocationResult {
  success: boolean;
  id?: string;
  error?: Error | string;
}

// User Profile Operations
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error getting user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception getting user profile:', error);
    return null;
  }
};

export const updateUserProfile = async (
  userId: string,
  profile: Partial<UserProfile>
): Promise<{ success: boolean; error: any | null }> => {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update(profile)
      .eq('id', userId);

    return { success: !error, error };
  } catch (error) {
    console.error('Exception updating user profile:', error);
    return { success: false, error };
  }
};

// User Locations Operations
export const getUserLocations = async (userId: string): Promise<UserLocation[]> => {
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('user_id', userId)
      .order('position');

    if (error) {
      console.error('Error fetching user locations:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception while fetching user locations:', error);
    return [];
  }
};

export const addUserLocation = async (location: UserLocation): Promise<LocationResult> => {
  try {
    // Get the user's current location count
    const { data: existingLocations, error: countError } = await supabase
      .from('locations')
      .select('id')
      .eq('user_id', location.user_id);

    if (countError) {
      return { success: false, error: countError };
    }

    // Check if user has reached the location limit (for free users)
    // This should be integrated with the subscription logic later
    const isFreeTier = true; // Placeholder for subscription check
    if (isFreeTier && existingLocations && existingLocations.length >= 3) {
      return { 
        success: false, 
        error: 'Free users can only save up to 3 locations. Upgrade to Premium for unlimited locations.'
      };
    }

    const { data, error } = await supabase
      .from('locations')
      .insert(location)
      .select('id')
      .single();

    if (error) {
      return { success: false, error };
    }

    return { success: true, id: data.id };
  } catch (error) {
    return { success: false, error: error as Error };
  }
};

export const updateUserLocation = async (
  locationId: string,
  updates: Partial<UserLocation>
): Promise<LocationResult> => {
  try {
    const { data, error } = await supabase
      .from('locations')
      .update(updates)
      .eq('id', locationId)
      .select('id')
      .single();

    if (error) {
      return { success: false, error };
    }

    return { success: true, id: data.id };
  } catch (error) {
    return { success: false, error: error as Error };
  }
};

export const deleteUserLocation = async (locationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', locationId);

    return !error;
  } catch (error) {
    console.error('Error deleting location:', error);
    return false;
  }
};

export const setDefaultLocation = async (locationId: string, userId: string): Promise<boolean> => {
  try {
    // First, unset all default locations for this user
    const { error: resetError } = await supabase
      .from('locations')
      .update({ is_default: false })
      .eq('user_id', userId);

    if (resetError) {
      console.error('Error resetting default locations:', resetError);
      return false;
    }

    // Then set the new default location
    const { error } = await supabase
      .from('locations')
      .update({ is_default: true })
      .eq('id', locationId);

    return !error;
  } catch (error) {
    console.error('Error setting default location:', error);
    return false;
  }
};

// Get a user's default location
export const getDefaultLocation = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .single();

    if (error) {
      // If no default location is found, try to get the first location
      const { data: firstLocation, error: firstLocationError } = await supabase
        .from('locations')
        .select('*')
        .eq('user_id', userId)
        .order('position')
        .limit(1)
        .single();

      if (firstLocationError) {
        return null;
      }

      return firstLocation;
    }

    return data;
  } catch (error) {
    console.error('Error getting default location:', error);
    return null;
  }
};

// Update the order of locations
export const updateLocationOrder = async (userId: string, locationIds: string[]): Promise<boolean> => {
  try {
    // Start a transaction to update all positions
    await supabase.rpc('update_location_positions', {
      user_id_param: userId,
      location_ids: locationIds
    });
    
    return true;
  } catch (error) {
    console.error('Error updating location order:', error);
    return false;
  }
};

// User Subscription Operations
export const getUserSubscription = async (userId: string): Promise<UserSubscription | null> => {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error) {
      console.error('Error getting user subscription:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception getting user subscription:', error);
    return null;
  }
};

export const createOrUpdateSubscription = async (
  subscription: Omit<UserSubscription, 'id'>
): Promise<{ success: boolean; id?: string; error: any | null }> => {
  try {
    // Check if subscription exists
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', subscription.user_id)
      .maybeSingle();

    if (existingSubscription) {
      // Update existing subscription
      const { error } = await supabase
        .from('user_subscriptions')
        .update(subscription)
        .eq('id', existingSubscription.id);

      return { success: !error, id: existingSubscription.id, error };
    } else {
      // Create new subscription
      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert(subscription)
        .select();

      if (error) {
        return { success: false, error };
      }

      return { success: true, id: data[0].id, error: null };
    }
  } catch (error) {
    console.error('Exception creating/updating subscription:', error);
    return { success: false, error };
  }
};

export const cancelSubscription = async (
  userId: string
): Promise<{ success: boolean; error: any | null }> => {
  try {
    const { error } = await supabase
      .from('user_subscriptions')
      .update({ status: 'canceled' })
      .eq('user_id', userId)
      .eq('status', 'active');

    return { success: !error, error };
  } catch (error) {
    console.error('Exception canceling subscription:', error);
    return { success: false, error };
  }
};

// Helper function to check if user has an active subscription
export const checkUserSubscription = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) {
      console.error('Error checking user subscription:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Exception checking user subscription:', error);
    return false;
  }
}; 