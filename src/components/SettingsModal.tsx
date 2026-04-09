import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { AuthContext } from '../App.tsx';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user, token, updateUser, logout } = useContext(AuthContext)!;
  const [ratio, setRatio] = useState(user?.min_per_coin_ratio || 1);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile/ratio', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ratio }),
      });
      const data = await res.json();
      if (!data.error) {
        updateUser(data);
        onClose();
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
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-surface rounded-xl p-6 shadow-xl z-[70] border border-orange-100"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-primary font-headline">Settings</h2>
              <button onClick={onClose} className="text-on-surface-variant">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-on-surface-variant px-1">
                  Minutes per Coin Ratio
                </label>
                <input
                  type="number"
                  value={ratio}
                  onChange={(e) => setRatio(Number(e.target.value))}
                  className="w-full h-14 px-4 bg-surface-container-lowest border-none rounded-default focus:ring-2 focus:ring-primary font-medium shadow-sm"
                />
                <p className="text-xs text-on-surface-variant px-1">
                  How many coins earned per minute of activity.
                </p>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full h-14 bg-primary text-on-primary font-bold rounded-xl shadow-lg active:scale-95 transition-all"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>

              <button
                onClick={logout}
                className="w-full h-14 bg-surface-container-high text-error font-bold rounded-xl active:scale-95 transition-all"
              >
                Logout
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
