import React, { useState, useEffect, createContext, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { Layout } from './components/Layout.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { Earn } from './components/Earn.tsx';
import { Spend } from './components/Spend.tsx';
import { Surprise } from './components/Surprise.tsx';
import { Auth } from './components/Auth.tsx';
import { User } from './types.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  openAuthModal: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    if (token) {
      fetch('/api/profile', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            logout();
          } else {
            setUser(data);
          }
        })
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = (user: User, token: string) => {
    setUser(user);
    setToken(token);
    localStorage.setItem('token', token);
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const openAuthModal = useCallback(() => {
    setIsAuthModalOpen(true);
  }, []);

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, openAuthModal }}>
      <Router>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/earn" element={<Earn />} />
            <Route path="/spend" element={<Spend />} />
            <Route path="/surprise" element={<Surprise />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        </Routes>
        <AnimatePresence>
          {isAuthModalOpen && !user && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-5">
              <motion.button
                type="button"
                aria-label="Close login"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAuthModalOpen(false)}
                className="absolute inset-0 bg-black/55 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, y: 36, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 24, scale: 0.95 }}
                transition={{ type: 'spring', bounce: 0.22, duration: 0.45 }}
                className="relative w-full max-w-sm"
              >
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(false)}
                  className="absolute -right-2 -top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary shadow-lg active:scale-95"
                >
                  <X className="h-5 w-5" />
                </button>
                <Auth variant="modal" onSuccess={() => setIsAuthModalOpen(false)} />
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </Router>
    </AuthContext.Provider>
  );
}
