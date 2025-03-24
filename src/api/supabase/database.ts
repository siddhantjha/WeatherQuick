import { supabase } from './config';
import { User } from '@supabase/supabase-js';

// Define types for database operations
export type UserProfile = {
  id: string;
  display_name: string;
  preferences: Record<string, any>;
};

export type UserLocation = {
  id: string;
  user_id: string;
  name: string;
  latitude: number;
  longitude: number;
  is_default: boolean;
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
      .from('user_locations')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error getting user locations:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception getting user locations:', error);
    return [];
  }
};

export const addUserLocation = async (
  location: Omit<UserLocation, 'id'>
): Promise<{ success: boolean; id?: string; error: any | null }> => {
  try {
    // Check if user has reached their location limit
    const isSubscribed = await checkUserSubscription(location.user_id);
    const { count } = await supabase
      .from('user_locations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', location.user_id);

    // Free users can only have 3 locations
    if (!isSubscribed && (count || 0) >= 3) {
      return {
        success: false,
        error: 'Free users can only save up to 3 locations. Upgrade to premium for unlimited locations.',
      };
    }

    const { data, error } = await supabase
      .from('user_locations')
      .insert(location)
      .select();

    if (error) {
      return { success: false, error };
    }

    return { success: true, id: data[0].id, error: null };
  } catch (error) {
    console.error('Exception adding user location:', error);
    return { success: false, error };
  }
};

export const updateUserLocation = async (
  locationId: string,
  userId: string,
  updates: Partial<UserLocation>
): Promise<{ success: boolean; error: any | null }> => {
  try {
    const { error } = await supabase
      .from('user_locations')
      .update(updates)
      .eq('id', locationId)
      .eq('user_id', userId);

    return { success: !error, error };
  } catch (error) {
    console.error('Exception updating user location:', error);
    return { success: false, error };
  }
};

export const deleteUserLocation = async (
  locationId: string,
  userId: string
): Promise<{ success: boolean; error: any | null }> => {
  try {
    const { error } = await supabase
      .from('user_locations')
      .delete()
      .eq('id', locationId)
      .eq('user_id', userId);

    return { success: !error, error };
  } catch (error) {
    console.error('Exception deleting user location:', error);
    return { success: false, error };
  }
};

export const setDefaultLocation = async (
  locationId: string,
  userId: string
): Promise<{ success: boolean; error: any | null }> => {
  try {
    // First, set all locations to non-default
    await supabase
      .from('user_locations')
      .update({ is_default: false })
      .eq('user_id', userId);

    // Then set the selected location as default
    const { error } = await supabase
      .from('user_locations')
      .update({ is_default: true })
      .eq('id', locationId)
      .eq('user_id', userId);

    return { success: !error, error };
  } catch (error) {
    console.error('Exception setting default location:', error);
    return { success: false, error };
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