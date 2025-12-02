import { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  signIn: (email: string, _password: string) => Promise<void>;
  signUp: (name: string, email: string, _password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const signIn = async (email: string, _password: string) => {
    // Mock authentication
    // Admin accounts: admin@waterways.com
    await new Promise((resolve) => globalThis.setTimeout(resolve, 500));
    setUser({
      id: '1',
      name: email.split('@')[0],
      email: email,
      isAdmin: email === 'admin@waterways.com',
    });
  };

  const signUp = async (name: string, email: string, _password: string) => {
    // Mock registration
    await new Promise((resolve) => globalThis.setTimeout(resolve, 500));
    setUser({
      id: '1',
      name: name,
      email: email,
      isAdmin: false,
    });
  };

  const signOut = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
