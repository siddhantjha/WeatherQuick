import { supabase } from './config';
import { RealtimeChannel } from '@supabase/supabase-js';

// Type for callback functions
type ChangeCallback<T> = (payload: { new: T; old: T | null }) => void;

// Store active subscriptions to manage them
const activeSubscriptions: Record<string, RealtimeChannel> = {};

// Subscribe to changes on user_locations table
export const subscribeToUserLocations = (
  userId: string,
  callback: ChangeCallback<any>
): RealtimeChannel => {
  const channel = supabase
    .channel(`user_locations:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_locations',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => callback(payload)
    )
    .subscribe();

  // Store the subscription reference
  activeSubscriptions[`user_locations:${userId}`] = channel;
  
  return channel;
};

// Subscribe to changes on user_subscriptions table
export const subscribeToUserSubscription = (
  userId: string,
  callback: ChangeCallback<any>
): RealtimeChannel => {
  const channel = supabase
    .channel(`user_subscriptions:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_subscriptions',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => callback(payload)
    )
    .subscribe();

  // Store the subscription reference
  activeSubscriptions[`user_subscriptions:${userId}`] = channel;
  
  return channel;
};

// Subscribe to changes on user_profiles table
export const subscribeToUserProfile = (
  userId: string,
  callback: ChangeCallback<any>
): RealtimeChannel => {
  const channel = supabase
    .channel(`user_profiles:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_profiles',
        filter: `id=eq.${userId}`,
      },
      (payload) => callback(payload)
    )
    .subscribe();

  // Store the subscription reference
  activeSubscriptions[`user_profiles:${userId}`] = channel;
  
  return channel;
};

// Unsubscribe from a specific channel
export const unsubscribe = (channelName: string): void => {
  if (activeSubscriptions[channelName]) {
    supabase.removeChannel(activeSubscriptions[channelName]);
    delete activeSubscriptions[channelName];
  }
};

// Unsubscribe from all channels (useful when logging out)
export const unsubscribeAll = (): void => {
  Object.keys(activeSubscriptions).forEach((channelName) => {
    supabase.removeChannel(activeSubscriptions[channelName]);
    delete activeSubscriptions[channelName];
  });
}; 