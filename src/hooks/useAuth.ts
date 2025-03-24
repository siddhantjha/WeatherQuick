import { useState, useEffect } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import {
  getCurrentUser,
  registerWithEmail,
  loginWithEmail,
  loginWithOAuth,
  logout,
  resetPassword,
  supabase,
} from '../api/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Initialize auth state
    const initAuth = async () => {
      try {
        setState((prevState) => ({ ...prevState, loading: true }));
        const user = await getCurrentUser();
        setState({
          user,
          session: null, // We don't have session info from getCurrentUser
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error initializing auth:', error);
        setState({
          user: null,
          session: null,
          loading: false,
          error: 'Failed to initialize authentication',
        });
      }
    };

    initAuth();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`Auth event: ${event}`);
      if (event === 'SIGNED_IN') {
        setState((prevState) => ({
          ...prevState,
          user: session?.user || null,
          session,
          loading: false,
          error: null,
        }));
      } else if (event === 'SIGNED_OUT') {
        setState({
          user: null,
          session: null,
          loading: false,
          error: null,
        });
      } else if (event === 'USER_UPDATED') {
        setState((prevState) => ({
          ...prevState,
          user: session?.user || prevState.user,
          session,
          loading: false,
          error: null,
        }));
      }
    });

    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Register new user
  const register = async (email: string, password: string) => {
    try {
      setState((prevState) => ({ ...prevState, loading: true, error: null }));
      const { user, session, error } = await registerWithEmail(email, password);
      
      if (error) {
        setState((prevState) => ({
          ...prevState,
          loading: false,
          error: error.message,
        }));
        return { success: false, error: error.message };
      }

      setState({
        user,
        session,
        loading: false,
        error: null,
      });
      
      return { success: true, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during registration';
      setState((prevState) => ({
        ...prevState,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  };

  // Login with email/password
  const login = async (email: string, password: string) => {
    try {
      setState((prevState) => ({ ...prevState, loading: true, error: null }));
      const { user, session, error } = await loginWithEmail(email, password);
      
      if (error) {
        setState((prevState) => ({
          ...prevState,
          loading: false,
          error: error.message,
        }));
        return { success: false, error: error.message };
      }

      setState({
        user,
        session,
        loading: false,
        error: null,
      });
      
      return { success: true, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during login';
      setState((prevState) => ({
        ...prevState,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  };

  // Login with OAuth provider
  const loginWithProvider = async (provider: 'google' | 'apple') => {
    try {
      setState((prevState) => ({ ...prevState, loading: true, error: null }));
      await loginWithOAuth(provider);
      // Auth state will be updated by the subscription
      return { success: true, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Unknown error during ${provider} login`;
      setState((prevState) => ({
        ...prevState,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  };

  // Logout
  const signOut = async () => {
    try {
      setState((prevState) => ({ ...prevState, loading: true, error: null }));
      const { error } = await logout();
      
      if (error) {
        setState((prevState) => ({
          ...prevState,
          loading: false,
          error: error.message,
        }));
        return { success: false, error: error.message };
      }

      // Auth state will be updated by the subscription
      return { success: true, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during logout';
      setState((prevState) => ({
        ...prevState,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  };

  // Request password reset
  const requestPasswordReset = async (email: string) => {
    try {
      setState((prevState) => ({ ...prevState, loading: true, error: null }));
      const { error } = await resetPassword(email);
      
      if (error) {
        setState((prevState) => ({
          ...prevState,
          loading: false,
          error: error.message,
        }));
        return { success: false, error: error.message };
      }

      setState((prevState) => ({
        ...prevState,
        loading: false,
        error: null,
      }));
      
      return { success: true, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during password reset';
      setState((prevState) => ({
        ...prevState,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  };

  // Clear error
  const clearError = () => {
    setState((prevState) => ({ ...prevState, error: null }));
  };

  return {
    user: state.user,
    session: state.session,
    loading: state.loading,
    error: state.error,
    register,
    login,
    loginWithProvider,
    signOut,
    requestPasswordReset,
    clearError,
    isAuthenticated: !!state.user,
  };
}; 