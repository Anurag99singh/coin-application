import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogOut, Lock, Gift } from 'lucide-react';
import { AuthContext } from '../App.tsx';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user, token, updateUser, logout } = useContext(AuthContext)!;
  const [saving, setSaving] = useState(false);
  const [parentalPassword, setParentalPassword] = useState('');
  const [isParentalUnlocked, setIsParentalUnlocked] = useState(false);
  const defaultSurprises = {
    '1': 'Extra 15 mins screen time!',
    '2': 'Special dessert tonight!',
    '3': 'New small toy!',
    '4': 'Trip to the park!',
    '5': 'Choose a movie for family night!'
  };
  const [surprises, setSurprises] = useState<Record<string, string>>(
    user?.surprises && Object.keys(user.surprises).length > 0 ? user.surprises : defaultSurprises
  );

  const handleUnlockParental = () => {
    if (parentalPassword === 'pari') {
      setIsParentalUnlocked(true);
      setParentalPassword('');
    } else {
      alert('Incorrect password!');
    }
  };

  const handleSaveSurprises = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile/surprises', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ surprises, password: 'pari' }),
      });
      const data = await res.json();
      if (!data.error) {
        updateUser(data);
        setIsParentalUnlocked(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-surface rounded-2xl p-6 shadow-2xl z-[70] border border-orange-100 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-surface py-2 z-10">
              <h2 className="text-2xl font-black text-primary font-headline">Settings</h2>
              <button onClick={onClose} className="text-on-surface-variant p-2 hover:bg-surface-container rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-8">
              {/* Parental Controls - Surprises */}
              <section className="space-y-4 bg-primary/5 p-4 rounded-2xl border border-primary/10">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Parental Controls</h3>
                </div>

                {!isParentalUnlocked ? (
                  <div className="space-y-3">
                    <p className="text-xs text-on-surface-variant font-medium">Enter password to edit level surprises.</p>
                    <div className="flex gap-2">
                      <input 
                        type="password"
                        value={parentalPassword}
                        onChange={(e) => setParentalPassword(e.target.value)}
                        placeholder="Password"
                        className="flex-1 h-12 px-4 bg-surface rounded-xl border border-primary/20 focus:ring-2 focus:ring-primary text-sm"
                      />
                      <button 
                        onClick={handleUnlockParental}
                        className="bg-primary text-on-primary px-4 rounded-xl font-bold text-sm active:scale-95 transition-all"
                      >
                        Unlock
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      {['1', '2', '3', '4', '5'].map(level => (
                        <div key={level} className="space-y-1">
                          <label className="text-[10px] font-black text-primary uppercase ml-1">Level {level}</label>
                          <input 
                            type="text"
                            value={surprises[level] || ''}
                            onChange={(e) => setSurprises({...surprises, [level]: e.target.value})}
                            className="w-full h-10 px-3 bg-surface rounded-lg border border-primary/20 text-sm font-medium"
                          />
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={handleSaveSurprises}
                      disabled={saving}
                      className="w-full h-12 bg-primary text-on-primary font-bold rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Gift className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save Surprises'}
                    </button>
                  </div>
                )}
              </section>

              <button
                onClick={logout}
                className="w-full h-14 bg-surface-container-high text-error font-bold rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
