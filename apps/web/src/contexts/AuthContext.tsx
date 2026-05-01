/* global setTimeout */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { supabase } from '../services/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { getUserProjects } from '../api/projects';
// Use browser setTimeout instead of Node.js timers

const PASSWORD_RECOVERY_STORAGE_KEY = 'waterways.passwordRecoveryPending';

function isPasswordRecoveryPending(): boolean {
  return globalThis.sessionStorage.getItem(PASSWORD_RECOVERY_STORAGE_KEY) === '1';
}

interface User {
  id: string;
  name: string;
  email: string;
  showNameOnMap: boolean;
  isAdmin: boolean;
  role?: string | null;
  status?: string | null;
  projects?: Array<{ id: string; name: string }>;
}

interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  sessionVersion: number;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionVersion, setSessionVersion] = useState(0);
  const authSyncIdRef = useRef(0);

  const updateUserFromSupabase = useCallback(
    async (supabaseUser: SupabaseUser, syncId?: number) => {
      if (isPasswordRecoveryPending()) {
        setUser(null);
        return;
      }

      let role: string | null = null;
      let status: string | null = null;
      let showNameOnMap = true;
      let roleFetchFailed = false;

      try {
        const rolePromise = supabase
          .from('users')
          .select('role, status, share_name_on_map')
          .eq('id', supabaseUser.id);
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('role/status fetch timeout')), 3000)
        );
        const res = (await Promise.race([rolePromise, timeout])) as {
          data?: Array<{ role?: string; status?: string; share_name_on_map?: boolean }>;
        };
        const currentUser = res?.data?.[0];

        if (currentUser) {
          if (typeof currentUser.role === 'string') role = currentUser.role;
          if (typeof currentUser.status === 'string') status = currentUser.status;
          if (typeof currentUser.share_name_on_map === 'boolean') {
            showNameOnMap = currentUser.share_name_on_map;
          }
        }
      } catch (err: unknown) {
        roleFetchFailed = true;
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.warn('Could not read user role/status:', message);
      }

      if (syncId != null && syncId !== authSyncIdRef.current) {
        return;
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

      const userId = supabaseUser.id;

      setUser((previousUser) => {
        const isSameUser = previousUser?.id === userId;
        const resolvedRole = roleFetchFailed && isSameUser ? (previousUser?.role ?? null) : role;
        const resolvedStatus =
          roleFetchFailed && isSameUser ? (previousUser?.status ?? null) : status;
        const resolvedShowNameOnMap =
          roleFetchFailed && isSameUser ? (previousUser?.showNameOnMap ?? true) : showNameOnMap;
        const resolvedProjects = isSameUser ? (previousUser?.projects ?? []) : [];

        return {
          id: userId,
          name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
          email: supabaseUser.email || '',
          showNameOnMap: resolvedShowNameOnMap,
          isAdmin: resolvedRole === 'admin',
          role: resolvedRole,
          status: resolvedStatus,
          projects: resolvedProjects,
        };
      });

      const loadProjects = async () => {
        try {
          const projectsPromise = getUserProjects(userId);
          const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('projects fetch timeout')), 3000)
          );
          const res = (await Promise.race([projectsPromise, timeout])) as {
            data?: Array<{ id: string; name: string }>;
          };
          const projects = (res?.data || []).map((p: { id: string; name: string }) => ({
            id: p.id,
            name: p.name,
          }));

          if (syncId != null && syncId !== authSyncIdRef.current) {
            return;
          }

          setUser((prev) => (prev && prev.id === userId ? { ...prev, projects } : prev));
        } catch (err) {
          console.warn('Failed to load user projects in AuthContext:', err);
        }
      };

      void loadProjects();
    },
    []
  );

  const syncSession = useCallback(
    async (forceTokenRefresh: boolean) => {
      const syncId = ++authSyncIdRef.current;

      try {
        const sessionResponse = await supabase.auth.getSession();
        let session = sessionResponse.data.session;

        if (forceTokenRefresh && session) {
          const refreshed = await supabase.auth.refreshSession();
          if (refreshed.error) {
            console.warn('Error refreshing session:', refreshed.error.message);
          } else if (refreshed.data.session) {
            session = refreshed.data.session;
          }
        }

        if (syncId !== authSyncIdRef.current) {
          return;
        }

        if (session?.user) {
          await updateUserFromSupabase(session.user, syncId);
        } else {
          setUser(null);
        }
      } catch (error) {
        if (syncId !== authSyncIdRef.current) {
          return;
        }

        console.error('Error checking session:', error);
        setUser(null);

        try {
          await supabase.auth.signOut();
        } catch (signOutError) {
          console.warn('Error clearing stale session:', signOutError);
        }
      } finally {
        if (syncId === authSyncIdRef.current) {
          setLoading(false);
          setSessionVersion((value) => value + 1);
        }
      }
    },
    [updateUserFromSupabase]
  );

  const refreshSession = useCallback(async () => {
    await syncSession(true);
  }, [syncSession]);

  useEffect(() => {
    // Check for existing session on mount
    void syncSession(false);

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const syncId = ++authSyncIdRef.current;
      if (session?.user) {
        try {
          await updateUserFromSupabase(session.user, syncId);
        } catch (error) {
          console.error('Error updating user from auth state change:', error);
          // Clear stale session if update fails
          await supabase.auth.signOut();
          setUser(null);
        }
      } else {
        setUser(null);
      }

      if (syncId === authSyncIdRef.current) {
        setLoading(false);
        setSessionVersion((value) => value + 1);
      }
    });

    const handleWindowFocus = () => {
      void syncSession(true);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void syncSession(true);
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      subscription.unsubscribe();
    };
  }, [syncSession, updateUserFromSupabase]);

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
    () => ({ user, signIn, signUp, signOut, refreshSession, sessionVersion, loading }),
    [user, signIn, signUp, signOut, refreshSession, sessionVersion, loading]
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
