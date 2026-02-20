/* global setTimeout */
import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { supabase } from '../services/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { getUserProjects } from '../api/projects';
// Use browser setTimeout instead of Node.js timers

interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  role?: string | null;
  projects?: string[];
}

interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          await updateUserFromSupabase(session.user);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        // Clear stale session if update fails
        await supabase.auth.signOut();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        try {
          await updateUserFromSupabase(session.user);
        } catch (error) {
          console.error('Error updating user from auth state change:', error);
          // Clear stale session if update fails
          await supabase.auth.signOut();
          setUser(null);
        }
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const updateUserFromSupabase = async (supabaseUser: SupabaseUser) => {
    console.log('updateUserFromSupabase called with', supabaseUser);
    // Try to read the user's role from `public.users` with a short timeout.
    // If the lookup fails or times out, fall back to defaults.
    let role: string | null = null;
    let status: string | null = null;
    try {
      const rolePromise = supabase.from('users').select('role, status').eq('id', supabaseUser.id);
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('role/status fetch timeout')), 3000)
      );
      const res: any = await Promise.race([rolePromise, timeout]);
      const currentUser = res?.data?.[0];
      if (currentUser) {
        if (typeof currentUser.role === 'string') role = currentUser.role;
        if (typeof currentUser.status === 'string') status = currentUser.status;
      }
    } catch (err: any) {
      // Don't block sign-in on role lookup failures.
      console.warn('Could not read user role/status:', err?.message ?? err);
    }
    console.log('role lookup finished, role/status =', role, status);

    // If the user is banned in the DB, immediately sign them out and don't set the user.
    if (status === 'banned') {
      console.log('User is banned, signing out...');
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Error signing out banned user:', e);
      }
      setUser(null);
      throw new Error('Account banned');
    }

    const isAdmin = role === 'admin';
    const userId = supabaseUser.id;

    setUser({
      id: userId,
      name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
      email: supabaseUser.email || '',
      isAdmin,
      role,
      projects: [],
    });

    const loadProjects = async () => {
      try {
        const projectsPromise = getUserProjects(userId);
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('projects fetch timeout')), 3000)
        );
        const res: any = await Promise.race([projectsPromise, timeout]);
        const projects = (res?.data || []).map((p: { name: string }) => p.name);
        setUser((prev) => (prev && prev.id === userId ? { ...prev, projects } : prev));
      } catch (err) {
        console.warn('Failed to load user projects in AuthContext:', err);
      }
    };

    void loadProjects();
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      await updateUserFromSupabase(data.user);
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      await updateUserFromSupabase(data.user);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    setUser(null);
  };

  const value = useMemo(() => ({ user, signIn, signUp, signOut, loading }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
