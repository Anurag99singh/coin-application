import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Gamepad2, Plus, ChevronDown, Timer, History } from 'lucide-react';
import { motion } from 'motion/react';
import { AuthContext } from '../App.tsx';
import { Activity } from '../types.ts';
import { cn } from '../lib/utils.ts';

const GAME_OPTIONS = [
  'Space Explorer',
  'Math Match',
  'Puzzle Quest',
  'Word Wizard',
  'Custom Activity...'
];

export function Play() {
  const { user, token, updateUser } = useContext(AuthContext)!;
  const navigate = useNavigate();
  const [selectedGame, setSelectedGame] = useState(GAME_OPTIONS[0]);
  const [customName, setCustomName] = useState('');
  const [duration, setDuration] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentPlays, setRecentPlays] = useState<Activity[]>([]);

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

    const activityName = selectedGame === 'Custom Activity...' ? customName : selectedGame;
    const pointsImpact = -(duration * (user?.min_per_coin_ratio || 1));

    if (user!.total_coins + pointsImpact < 0) {
      setError("Points are less to spend in the chest! Earn more first. 🪙");
      setLoading(false);
      return;
    }

    try {
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
        }),
      });

      if (res.ok) {
        const updatedUser = { ...user!, total_coins: user!.total_coins + pointsImpact };
        updateUser(updatedUser);
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
        <h1 className="text-4xl font-extrabold tracking-tight text-primary mb-2 font-headline uppercase">Play</h1>
        <p className="text-on-surface-variant font-medium">Choose a game and start your adventure!</p>
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
                {GAME_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-outline w-5 h-5" />
            </div>
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

          <div className="space-y-2">
            <label className="block text-sm font-bold text-on-surface-variant px-1">Play Duration (minutes)</label>
            <div className="relative">
              <input 
                type="number"
                required
                min="1"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                placeholder="Enter minutes"
                className="w-full h-14 pl-4 pr-12 bg-surface-container-lowest border-none rounded-default text-on-surface font-medium focus:ring-2 focus:ring-primary shadow-sm"
              />
              <Timer className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant w-5 h-5" />
            </div>
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

      {/* Recent Play Section */}
      <section className="space-y-4 pb-8">
        <div className="flex justify-between items-end px-2">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-secondary" />
            <h2 className="text-xl font-bold text-on-background font-headline">Recent Play</h2>
          </div>
          <Link to="/history" className="text-sm font-semibold text-secondary hover:underline">View All</Link>
        </div>
        <div className="space-y-3">
          {recentPlays.map((activity) => (
            <div key={activity._id} className="bg-surface-container-low rounded-xl p-4 flex items-center justify-between shadow-sm border border-blue-100/50">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-on-surface">{activity.activityName}</span>
                <span className="text-[10px] text-on-surface-variant font-medium">
                  {new Date(activity.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="bg-secondary-container/20 px-3 py-1 rounded-full">
                <span className="text-sm font-black text-secondary">{activity.pointsImpact}</span>
              </div>
            </div>
          ))}
          {recentPlays.length === 0 && (
            <div className="bg-surface-container-low rounded-xl p-8 text-center text-on-surface-variant text-sm border-2 border-dashed border-outline-variant/20">
              No games played yet. Time for some fun! 🎮
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
