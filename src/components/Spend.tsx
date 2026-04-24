import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Gamepad2, Plus, ChevronDown, Timer, History, Trash2, Coins } from 'lucide-react';
import { motion } from 'motion/react';
import { AuthContext } from '../App.tsx';
import { Activity } from '../types.ts';
import { cn } from '../lib/utils.ts';

const DEFAULT_GAME_OPTIONS = [
  'Space Explorer',
  'Math Match',
  'Puzzle Quest',
  'Word Wizard'
];

export function Spend() {
  const { user, token, updateUser } = useContext(AuthContext)!;
  const navigate = useNavigate();
  const [selectedGame, setSelectedGame] = useState(DEFAULT_GAME_OPTIONS[0]);
  const [customName, setCustomName] = useState('');
  const [duration, setDuration] = useState(20);
  const [ratio, setRatio] = useState(user?.min_per_coin_ratio || 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentPlays, setRecentPlays] = useState<Activity[]>([]);

  const allOptions = [...DEFAULT_GAME_OPTIONS, ...(user?.custom_play_activities || []), 'Custom Activity...'];

  useEffect(() => {
    fetch('/api/activities/recent/spend', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setRecentPlays(data));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const isCustomInput = selectedGame === 'Custom Activity...';
    const activityName = isCustomInput ? customName : selectedGame;
    const pointsImpact = -Math.round(duration * ratio);

    if (user!.total_coins + pointsImpact < 0) {
      setError("Points are less to spend in the chest! Earn more first. 🪙");
      setLoading(false);
      return;
    }

    try {
      // First update ratio if it changed
      if (ratio !== user?.min_per_coin_ratio) {
        await fetch('/api/profile/ratio', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ratio }),
        });
      }

      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'spend',
          activityName,
          durationMinutes: duration,
          pointsImpact,
          isCustom: isCustomInput
        }),
      });

      if (res.ok) {
        // Refetch profile to get updated coins and custom activities
        const profileRes = await fetch('/api/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profileData = await profileRes.json();
        updateUser(profileData);
        
        navigate('/');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-8 space-y-8">
      {/* Hero Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-primary mb-2 font-headline uppercase">Spend</h1>
        <p className="text-on-surface-variant font-medium">Choose a reward and spend your points!</p>
      </div>

      {/* Form */}
      <section className="bg-surface-container-low rounded-xl p-6 mb-8 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Gamepad2 className="w-6 h-6 text-tertiary fill-current" />
          <h2 className="text-xl font-bold text-on-surface font-headline">Select a Game</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-error/10 text-error text-sm p-4 rounded-xl font-bold border border-error/20"
            >
              {error}
            </motion.div>
          )}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-on-surface-variant px-1">Choose Game</label>
            <div className="relative">
              <select 
                value={selectedGame}
                onChange={(e) => setSelectedGame(e.target.value)}
                className="w-full h-14 pl-4 pr-10 bg-surface-container-lowest border-none rounded-default text-on-surface font-medium focus:ring-2 focus:ring-primary appearance-none shadow-sm"
              >
                {allOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-outline w-5 h-5" />
            </div>

            {/* Custom Game List */}
            {(user?.custom_play_activities || []).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {user?.custom_play_activities?.map(act => (
                  <div key={act} className="flex items-center gap-1 bg-surface-container-high px-3 py-1.5 rounded-full text-xs font-bold text-on-surface-variant">
                    <span className="cursor-pointer" onClick={() => setSelectedGame(act)}>{act}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedGame === 'Custom Activity...' && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <label className="block text-sm font-bold text-on-surface-variant px-1">Game Name</label>
              <input 
                type="text"
                required
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Enter game name"
                className="w-full h-14 px-4 bg-surface-container-lowest border-none rounded-default text-on-surface font-medium focus:ring-2 focus:ring-primary shadow-sm"
              />
            </motion.div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-on-surface-variant px-1">Duration (min)</label>
              <div className="relative">
                <input 
                  type="number"
                  required
                  min="1"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  placeholder="Enter minutes"
                  className="w-full h-14 pl-4 pr-10 bg-surface-container-lowest border-none rounded-default text-on-surface font-medium focus:ring-2 focus:ring-primary shadow-sm"
                />
                <Timer className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant w-4 h-4" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-on-surface-variant px-1">Ratio (pts/min)</label>
              <div className="relative">
                <input 
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={ratio}
                  onChange={(e) => setRatio(Math.round(Number(e.target.value)))}
                  className="w-full h-14 pl-4 pr-10 bg-surface-container-lowest border-none rounded-default text-on-surface font-medium focus:ring-2 focus:ring-primary shadow-sm"
                />
                <Coins className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="bg-secondary/5 p-4 rounded-xl border border-secondary/10 flex justify-between items-center">
            <span className="text-sm font-bold text-on-surface-variant">Cost to Play</span>
            <span className="text-2xl font-black text-secondary">{Math.round(duration * ratio)}</span>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-gradient-to-b from-primary-container to-primary text-on-primary font-bold text-lg rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Plus className="w-6 h-6" />
            {loading ? 'Processing...' : 'Spend Points'}
          </button>
        </form>
      </section>

      {/* Recent Spend Section - Table Format */}
      <section className="space-y-4 pb-8">
        <div className="flex justify-between items-end px-2">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-secondary" />
            <h2 className="text-xl font-bold text-on-background font-headline">Recent Spending</h2>
          </div>
          <Link to="/history" className="text-sm font-semibold text-secondary hover:underline">View All</Link>
        </div>
        
        <div className="bg-surface-container-low rounded-lg overflow-hidden p-1 shadow-sm">
          <div className="bg-surface-container-lowest rounded-default overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container text-on-surface-variant text-[11px] uppercase tracking-wider font-bold">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Game</th>
                  <th className="px-4 py-3 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100/50">
                {recentPlays.map((activity) => (
                  <tr key={activity._id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-4 py-4 text-xs font-medium">
                      {new Date(activity.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-on-surface">{activity.activityName}</span>
                        <span className="text-[10px] text-on-surface-variant font-medium">
                          {activity.durationMinutes} mins
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-xs font-bold text-error">
                        {Math.round(activity.pointsImpact)}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentPlays.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-on-surface-variant text-sm">
                      No games played yet. Time for some fun! 🎮
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
