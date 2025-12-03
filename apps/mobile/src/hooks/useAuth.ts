import { useState, useEffect } from 'react';
import { supabase } from '../../../../packages/shared/src/supabase/client'; // Import the client
// You might need to install and import the User type if using TypeScript
// import { User } from '@supabase/supabase-js';

interface AuthState {
  // New/Updated State properties for user management
  userId: string | null;
  // user: User | null; // You can add the full user object if needed

  // Existing State properties
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  // Updated initial state to include userId and assume loading until status is known
  const [state, setState] = useState<AuthState>({
    userId: null,
    isAuthenticated: false,
    loading: true,
    error: null,
  });

  // ADDED: Logic to fetch and listen for the authenticated user
  useEffect(() => {
    // 1. Set up the real-time listener for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user ?? null;
      setState((s) => ({
        ...s,
        userId: user?.id ?? null,
        isAuthenticated: !!user,
        loading: false,
        error: null,
      }));
    });

    // 2. Initial fetch in case onAuthStateChange doesn't fire immediately
    const checkInitialUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setState((s) => ({
            ...s,
            userId: user.id,
            isAuthenticated: true,
            loading: false,
          }));
        } else {
          setState((s) => ({ ...s, loading: false }));
        }
      } catch (error) {
        console.error('Initial user check failed:', error);
        setState((s) => ({ ...s, loading: false, error: 'Failed to check session' }));
      }
    };
    checkInitialUser();

    // 3. Cleanup listener
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []); // Only run once on mount

  /**
   * Login with email & password.
   * For now this is a fake implementation that just "logs in" immediately.
   */
  const login = async (_email: string, _password: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));

    // TODO: replace with real API call using _email and _password
    // The state update below is the original mock logic
    setState({
      userId: 'mock-user-id-after-login', // Added mock ID for consistency
      isAuthenticated: true,
      loading: false,
      error: null,
    });
  };

  /**
   * Signup with name, email, password.
   */
  const signup = async (_name: string, _email: string, _password: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));

    // TODO: replace with real API call using _name, _email, _password
    // The state update below is the original mock logic
    setState({
      userId: 'mock-user-id-after-signup', // Added mock ID for consistency
      isAuthenticated: true,
      loading: false,
      error: null,
    });
  };

  /**
   * Trigger a password reset email.
   */
  const resetPassword = async (_email: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));

    // TODO: replace with real API call using _email
    // The state update below is the original mock logic
    setState((s) => ({
      ...s,
      loading: false,
    }));
  };

  return {
    ...state,
    login,
    signup,
    resetPassword,
  };
}
