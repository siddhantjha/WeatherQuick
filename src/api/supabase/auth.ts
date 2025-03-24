import { supabase } from './config';
import { AuthError, User, Session, UserResponse } from '@supabase/supabase-js';

// Define types for authentication
type AuthResponse = {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
};

// Register a new user with email and password
export const registerWithEmail = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { user: null, session: null, error };
    }

    // Create a user profile when a new user signs up
    if (data.user) {
      await createUserProfile(data.user.id);
    }

    return { user: data.user, session: data.session, error: null };
  } catch (error) {
    console.error('Error during registration:', error);
    return {
      user: null,
      session: null,
      error: new AuthError('Unknown error during registration'),
    };
  }
};

// Login with email and password
export const loginWithEmail = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, session: null, error };
    }

    return { user: data.user, session: data.session, error: null };
  } catch (error) {
    console.error('Error during login:', error);
    return {
      user: null,
      session: null,
      error: new AuthError('Unknown error during login'),
    };
  }
};

// Login with OAuth provider (Google, Apple)
export const loginWithOAuth = async (provider: 'google' | 'apple'): Promise<void> => {
  try {
    await supabase.auth.signInWithOAuth({ provider });
  } catch (error) {
    console.error(`Error during ${provider} OAuth login:`, error);
    throw error;
  }
};

// Logout the current user
export const logout = async (): Promise<{ error: AuthError | null }> => {
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (error) {
    console.error('Error during logout:', error);
    return {
      error: new AuthError('Unknown error during logout'),
    };
  }
};

// Get the current user
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Reset password
export const resetPassword = async (email: string): Promise<{ error: AuthError | null }> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error };
  } catch (error) {
    console.error('Error during password reset:', error);
    return {
      error: new AuthError('Unknown error during password reset'),
    };
  }
};

// Update password
export const updatePassword = async (password: string): Promise<{ error: AuthError | null }> => {
  try {
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  } catch (error) {
    console.error('Error updating password:', error);
    return {
      error: new AuthError('Unknown error during password update'),
    };
  }
};

// Helper function to create a user profile on signup
const createUserProfile = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase.from('user_profiles').insert({
      id: userId,
      display_name: '',
      preferences: {},
    });

    if (error) {
      console.error('Error creating user profile:', error);
    }
  } catch (error) {
    console.error('Exception creating user profile:', error);
  }
};

// Subscribe to auth state changes
export const subscribeToAuthChanges = (
  callback: (event: 'SIGNED_IN' | 'SIGNED_OUT' | 'USER_UPDATED', session: Session | null) => void
) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
      callback(event, session);
    }
  });
}; 