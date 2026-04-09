import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Stars, PlusCircle, ChevronDown, History } from 'lucide-react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { AuthContext } from '../App.tsx';
import { Activity } from '../types.ts';
import { cn } from '../lib/utils.ts';

const EARN_OPTIONS = [
  'Reading Time',
  'Math Exercises',
  'Piano Practice',
  'Cleaned Room',
  'Physical Play',
  'Custom Activity...'
];

export function Earn() {
  const { user, token, updateUser } = useContext(AuthContext)!;
  const navigate = useNavigate();
  const [selectedActivity, setSelectedActivity] = useState(EARN_OPTIONS[0]);
  const [customName, setCustomName] = useState('');
  const [duration, setDuration] = useState(20);
  const [loading, setLoading] = useState(false);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [recentEarnings, setRecentEarnings] = useState<Activity[]>([]);

  useEffect(() => {
    fetch('/api/activities/today-earnings', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setTodayEarnings(data.earnings || 0));

    fetch('/api/activities/recent/earn', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setRecentEarnings(data));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const activityName = selectedActivity === 'Custom Activity...' ? customName : selectedActivity;
    const pointsImpact = duration * (user?.min_per_coin_ratio || 1);

    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'earn',
          activityName,
          durationMinutes: duration,
          pointsImpact,
        }),
      });

      if (res.ok) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#fd9000', '#8a4c00', '#a7295a']
        });
        const updatedUser = { ...user!, total_coins: user!.total_coins + pointsImpact };
        updateUser(updatedUser);
        setTodayEarnings(prev => prev + pointsImpact);
        setTimeout(() => navigate('/'), 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-8 space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary rounded-xl p-8 text-on-primary shadow-lg">
        <div className="relative z-10">
          <p className="font-label text-sm uppercase tracking-widest opacity-80 mb-2">Today's Earnings</p>
          <div className="flex items-baseline gap-2">
            <h2 className="font-headline text-5xl font-extrabold">
              {todayEarnings}
            </h2>
            <span className="text-xl font-bold opacity-90">Points</span>
          </div>
        </div>
        <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-primary-container rounded-full opacity-20 blur-2xl"></div>
        <Stars className="absolute right-4 top-4 w-16 h-16 opacity-20 fill-current" />
      </section>

      {/* Form */}
      <section className="bg-surface-container-low rounded-lg p-6 shadow-sm">
        <h3 className="font-headline text-xl font-bold mb-6 text-on-background">Log New Activity</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface-variant ml-1">What did you do?</label>
            <div className="relative">
              <select 
                value={selectedActivity}
                onChange={(e) => setSelectedActivity(e.target.value)}
                className="w-full h-14 pl-4 pr-10 bg-surface-container-lowest border-none rounded-default focus:ring-2 focus:ring-primary appearance-none font-medium shadow-sm"
              >
                {EARN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant w-5 h-5" />
            </div>
          </div>

          {selectedActivity === 'Custom Activity...' && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <label className="block text-sm font-semibold text-on-surface-variant ml-1">Activity Name</label>
              <input 
                type="text"
                required
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Enter activity name"
                className="w-full h-14 px-4 bg-surface-container-lowest border-none rounded-default focus:ring-2 focus:ring-primary font-medium shadow-sm"
              />
            </motion.div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface-variant ml-1">Duration (minutes)</label>
            <input 
              type="number"
              required
              min="1"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full h-14 px-4 bg-surface-container-lowest border-none rounded-default focus:ring-2 focus:ring-primary font-medium shadow-sm"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-primary text-on-primary font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary-dim transition-all active:scale-95 shadow-md disabled:opacity-50"
          >
            <PlusCircle className="w-5 h-5" />
            {loading ? 'Adding...' : 'Add Points'}
          </button>
        </form>
      </section>

      {/* Recent Earnings Section */}
      <section className="space-y-4 pb-8">
        <div className="flex justify-between items-end px-2">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-on-background font-headline">Recent Earnings</h2>
          </div>
          <Link to="/history" className="text-sm font-semibold text-secondary hover:underline">View All</Link>
        </div>
        <div className="space-y-3">
          {recentEarnings.map((activity) => (
            <div key={activity._id} className="bg-surface-container-low rounded-xl p-4 flex items-center justify-between shadow-sm border border-orange-100/50">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-on-surface">{activity.activityName}</span>
                <span className="text-[10px] text-on-surface-variant font-medium">
                  {new Date(activity.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="bg-primary-container/20 px-3 py-1 rounded-full">
                <span className="text-sm font-black text-primary">+{activity.pointsImpact}</span>
              </div>
            </div>
          ))}
          {recentEarnings.length === 0 && (
            <div className="bg-surface-container-low rounded-xl p-8 text-center text-on-surface-variant text-sm border-2 border-dashed border-outline-variant/20">
              No earnings yet today. Let's get started! 🚀
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
