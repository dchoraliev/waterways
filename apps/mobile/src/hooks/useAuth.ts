import { useState, useEffect } from 'react';
import { supabase } from '@waterways/shared/src/supabase/client';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { signIn, signUp, sendResetPasswordEmail } from '@waterways/shared/src/supabase/auth';

interface AuthState {
  userId: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    userId: null,
    isAuthenticated: false,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let authListener: { subscription: { unsubscribe: () => void } } | null = null;

    try {
      const listenerResult = supabase.auth.onAuthStateChange(
        (_event: AuthChangeEvent, session: Session | null) => {
          const user = session?.user ?? null;
          setState((s) => ({
            ...s,
            userId: user?.id ?? null,
            isAuthenticated: !!user,
            loading: false,
            error: null,
          }));
        }
      );
      authListener = listenerResult.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to initialize auth listener';
      setState((s) => ({
        ...s,
        userId: null,
        isAuthenticated: false,
        loading: false,
        error: message,
      }));
      return () => {};
    }

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
    void checkInitialUser();

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const { error } = await signIn(email, password);

      if (error) {
        setState((s) => ({
          ...s,
          loading: false,
          isAuthenticated: false,
          userId: null,
          error: error.message ?? 'Sign in failed',
        }));
        return;
      }

      const sessionResponse = await supabase.auth.getSession();
      const user = sessionResponse.data.session?.user ?? null;

      if (!user) {
        setState((s) => ({
          ...s,
          loading: false,
          isAuthenticated: false,
          userId: null,
          error: 'Sign in did not return a user session',
        }));
        return;
      }

      setState((s) => ({
        ...s,
        userId: user.id,
        isAuthenticated: true,
        loading: false,
        error: null,
      }));
    } catch (error) {
      setState((s) => ({
        ...s,
        loading: false,
        isAuthenticated: false,
        userId: null,
        error: error instanceof Error ? error.message : 'Sign in failed',
      }));
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const trimmedName = name.trim();
      const nameParts = trimmedName.length > 0 ? trimmedName.split(/\s+/) : [];
      const firstName = nameParts[0] ?? '';
      const lastName = nameParts.slice(1).join(' ');
      const { error } = await signUp(email, password, firstName, lastName);

      if (error) {
        setState((s) => ({
          ...s,
          loading: false,
          isAuthenticated: false,
          userId: null,
          error: error.message ?? 'Sign up failed',
        }));
        return;
      }

      const userResponse = await supabase.auth.getUser();
      const user = userResponse.data.user;

      setState((s) => ({
        ...s,
        userId: user?.id ?? null,
        isAuthenticated: !!user,
        loading: false,
        error: null,
      }));
    } catch (error) {
      setState((s) => ({
        ...s,
        loading: false,
        isAuthenticated: false,
        userId: null,
        error: error instanceof Error ? error.message : 'Sign up failed',
      }));
    }
  };

  const resetPassword = async (email: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const { error } = await sendResetPasswordEmail(email);

      setState((s) => ({
        ...s,
        loading: false,
        error: error?.message ?? null,
      }));
    } catch (error) {
      setState((s) => ({
        ...s,
        loading: false,
        error: error instanceof Error ? error.message : 'Reset password failed',
      }));
    }
  };

  return {
    ...state,
    login,
    signup,
    resetPassword,
  };
}
