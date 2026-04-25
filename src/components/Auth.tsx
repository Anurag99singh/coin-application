import React, { useState, useContext } from 'react';
import { AuthContext } from '../App.tsx';
import { cn } from '../lib/utils.ts';

interface AuthProps {
  variant?: 'page' | 'modal';
  onSuccess?: () => void;
}

export function Auth({ variant = 'page', onSuccess }: AuthProps) {
  const { login } = useContext(AuthContext)!;
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        login(data.user, data.token);
        onSuccess?.();
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isModal = variant === 'modal';

  return (
    <div className={cn(
      'flex flex-col items-center justify-center bg-background',
      isModal ? 'rounded-[2rem] px-5 py-8 shadow-2xl' : 'min-h-screen px-6'
    )}>
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-black text-primary font-headline tracking-tight">Habit Hero</h1>
          <p className="mt-2 text-on-surface-variant font-medium">
            {isLogin ? 'Welcome back, hero!' : 'Start your adventure today!'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface-container-low p-8 rounded-xl shadow-lg space-y-6 border border-orange-100">
          {error && (
            <div className="bg-error/10 text-error text-sm p-3 rounded-lg font-medium">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-bold text-on-surface-variant px-1">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-14 px-4 bg-surface-container-lowest border-none rounded-default focus:ring-2 focus:ring-primary font-medium shadow-sm"
              placeholder="Enter username"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-on-surface-variant px-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-14 px-4 bg-surface-container-lowest border-none rounded-default focus:ring-2 focus:ring-primary font-medium shadow-sm"
              placeholder="Enter password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-primary text-on-primary font-bold rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Processing...' : isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary font-bold hover:underline"
          >
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  );
}
