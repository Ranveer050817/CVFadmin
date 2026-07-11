import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Loader } from '../components/Loader';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader />;
  }

  if (user) {
    return <Navigate to="/admin" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        navigate('/admin');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-sm border border-gray-100">
        <div className="text-center">
          <div className="text-xs tracking-widest uppercase text-gray-500 mb-1">Management</div>
          <h2 className="text-3xl font-bold tracking-tight text-gold">
            CLICK VICK
          </h2>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200">
              {error}
            </div>
          )}
          
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full appearance-none rounded-lg border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 focus:z-10 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold sm:text-sm transition-colors"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full appearance-none rounded-lg border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 focus:z-10 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold sm:text-sm transition-colors"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loadingAction}
              className="group relative flex w-full justify-center rounded-lg border border-transparent bg-black px-4 py-3 text-sm font-medium text-white hover:bg-gold focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 shadow-sm"
            >
              {loadingAction ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
