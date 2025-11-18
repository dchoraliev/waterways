import { useState } from 'react';

interface AuthState {
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    loading: false,
    error: null,
  });

  /**
   * Login with email & password.
   * For now this is a fake implementation that just "logs in" immediately.
   * Later you can plug in Supabase or your API here.
   */
  const login = async (_email: string, _password: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));

    // TODO: replace with real API call using _email and _password
    setState({
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
    setState({
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
