import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import { WaveIcon } from '../components/WaveIcon';
import { toast } from 'sonner';

interface SignInProps {
  onNavigateToSignUp: () => void;
  onSuccess?: () => void;
}

export function SignIn({ onNavigateToSignUp, onSuccess }: SignInProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);
      toast.success('Successfully signed in!');
      onSuccess?.();
    } catch {
      toast.error('Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1 text-center">
        <div className="flex justify-center mb-2">
          <WaveIcon className="size-16 text-primary" />
        </div>
        <h2>Welcome back</h2>
        <p className="text-sm text-muted-foreground">
          Sign in to your Waterways Observation System account
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
        <div className="text-sm text-center text-muted-foreground">
          Don&#39;t have an account?{' '}
          <button
            type="button"
            onClick={onNavigateToSignUp}
            className="text-primary hover:underline"
          >
            Sign up
          </button>
        </div>
      </form>
    </div>
  );
}
