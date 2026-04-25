import React, { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogOut, Lock, Gift } from 'lucide-react';
import { AuthContext } from '../App.tsx';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_SURPRISE_GOAL = 500;
const DEFAULT_SURPRISE_REWARD = 'Mystery Surprise';

const cleanPositiveIntegerText = (value: string) => {
  return value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
};

const parsePositiveInteger = (value: string, fallback = 1) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.round(parsed);
};

async function readJsonResponse(res: Response) {
  const text = await res.text();
  if (!text.trim()) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { error: 'Server returned an unexpected response. Please restart the app server and try again.' };
  }
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user, token, updateUser, logout } = useContext(AuthContext)!;
  const [saving, setSaving] = useState(false);
  const [parentalPassword, setParentalPassword] = useState('');
  const [isParentalUnlocked, setIsParentalUnlocked] = useState(false);
  const [surpriseGoalPoints, setSurpriseGoalPoints] = useState(String(user?.surprise_goal_points || DEFAULT_SURPRISE_GOAL));
  const [surpriseRewardName, setSurpriseRewardName] = useState(user?.surprise_reward_name || DEFAULT_SURPRISE_REWARD);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setSurpriseGoalPoints(String(user?.surprise_goal_points || DEFAULT_SURPRISE_GOAL));
    setSurpriseRewardName(user?.surprise_reward_name || DEFAULT_SURPRISE_REWARD);
    setSaveMessage('');
    setSaveError('');
  }, [isOpen]);

  const handleUnlockParental = () => {
    if (parentalPassword === 'pari') {
      setIsParentalUnlocked(true);
      setParentalPassword('');
    } else {
      alert('Incorrect password!');
    }
  };

  const handleSaveSurpriseGoal = async () => {
    setSaving(true);
    setSaveMessage('');
    setSaveError('');
    try {
      const targetPoints = parsePositiveInteger(surpriseGoalPoints, DEFAULT_SURPRISE_GOAL);
      const rewardName = surpriseRewardName.trim() || DEFAULT_SURPRISE_REWARD;

      const res = await fetch('/api/profile/surprise-goal', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          surprise_goal_points: targetPoints,
          surprise_reward_name: rewardName,
          password: 'pari'
        }),
      });
      const data = await readJsonResponse(res);
      if (!res.ok || data.error || !data._id) {
        setSaveError(data.error || 'Could not save surprise. Please try again.');
        return;
      }

      updateUser(data);
      setSurpriseGoalPoints(String(targetPoints));
      setSurpriseRewardName(rewardName);
      setSaveMessage('Surprise saved.');
      setIsParentalUnlocked(false);
    } catch (err) {
      console.error(err);
      setSaveError('Could not save surprise. Please check the server and try again.');
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
              {/* Parental Controls - Surprise Goal */}
              <section className="space-y-4 bg-primary/5 p-4 rounded-2xl border border-primary/10">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Parental Controls</h3>
                </div>

                {!isParentalUnlocked ? (
                  <div className="space-y-3">
                    <p className="text-xs text-on-surface-variant font-medium">Enter password to edit the surprise reward.</p>
                    {saveError && (
                      <p className="rounded-xl bg-error/10 px-3 py-2 text-xs font-bold text-error">
                        {saveError}
                      </p>
                    )}

                    {saveMessage && (
                      <p className="rounded-xl bg-primary-container/10 px-3 py-2 text-xs font-bold text-primary">
                        {saveMessage}
                      </p>
                    )}

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
                    <div className="rounded-2xl bg-surface p-4 border border-primary/10">
                      <div className="flex items-center gap-2 text-primary">
                        <Gift className="w-5 h-5 fill-current" />
                        <span className="text-sm font-black uppercase tracking-wider">Surprise Setup</span>
                      </div>
                      <p className="mt-2 text-xs font-bold text-on-surface-variant">
                        Choose the reward and how many points your child needs to unlock it.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-primary uppercase ml-1">Reward Name</label>
                      <input
                        type="text"
                        value={surpriseRewardName}
                        onChange={(e) => setSurpriseRewardName(e.target.value)}
                        className="w-full h-11 px-3 bg-surface rounded-lg border border-primary/20 text-sm font-medium"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-primary uppercase ml-1">Target Points</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={surpriseGoalPoints}
                        onChange={(e) => setSurpriseGoalPoints(cleanPositiveIntegerText(e.target.value))}
                        className="w-full h-11 px-3 bg-surface rounded-lg border border-primary/20 text-sm font-medium"
                      />
                    </div>

                    {saveError && (
                      <p className="rounded-xl bg-error/10 px-3 py-2 text-xs font-bold text-error">
                        {saveError}
                      </p>
                    )}

                    {saveMessage && (
                      <p className="rounded-xl bg-primary-container/10 px-3 py-2 text-xs font-bold text-primary">
                        {saveMessage}
                      </p>
                    )}

                    <button
                      onClick={handleSaveSurpriseGoal}
                      disabled={saving}
                      className="w-full h-12 bg-primary text-on-primary font-bold rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Gift className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save Surprise'}
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
