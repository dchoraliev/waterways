/* global setTimeout */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from 'react';
import { supabase } from '../services/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { getUserProjects } from '../api/projects';
// Use browser setTimeout instead of Node.js timers

interface User {
  id: string;
  name: string;
  email: string;
  showNameOnMap: boolean;
  isAdmin: boolean;
  role?: string | null;
  projects?: Array<{ id: string; name: string }>;
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

  const updateUserFromSupabase = useCallback(async (supabaseUser: SupabaseUser) => {
    let role: string | null = null;
    let status: string | null = null;
    let showNameOnMap = true;
    try {
      const rolePromise = supabase
        .from('users')
        .select('role, status, share_name_on_map')
        .eq('id', supabaseUser.id);
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('role/status fetch timeout')), 3000)
      );
      const res: any = await Promise.race([rolePromise, timeout]);
      const currentUser = res?.data?.[0];
      if (currentUser) {
        if (typeof currentUser.role === 'string') role = currentUser.role;
        if (typeof currentUser.status === 'string') status = currentUser.status;
        if (typeof currentUser.share_name_on_map === 'boolean') {
          showNameOnMap = currentUser.share_name_on_map;
        }
      }
    } catch (err: any) {
      console.warn('Could not read user role/status:', err?.message ?? err);
    }

    if (status === 'banned') {
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
      showNameOnMap,
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
        const projects = (res?.data || []).map((p: { id: string; name: string }) => ({
          id: p.id,
          name: p.name,
        }));
        setUser((prev) => (prev && prev.id === userId ? { ...prev, projects } : prev));
      } catch (err) {
        console.warn('Failed to load user projects in AuthContext:', err);
      }
    };

    void loadProjects();
  }, []);

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
  }, [updateUserFromSupabase]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error('Sign in did not return a user session');
    }
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
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

    if (!data.user) {
      throw new Error('Sign up did not return a user');
    }
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, signIn, signUp, signOut, loading }),
    [user, signIn, signUp, signOut, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
