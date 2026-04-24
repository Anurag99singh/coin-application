import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Stars, PlusCircle, ChevronDown, History, Trash2, Timer, Coins } from 'lucide-react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { AuthContext } from '../App.tsx';
import { Activity } from '../types.ts';
import { cn } from '../lib/utils.ts';

const DEFAULT_EARN_OPTIONS = [
  'Reading Time',
  'Math Exercises',
  'Piano Practice',
  'Cleaned Room',
  'Physical Play'
];

export function Earn() {
  const { user, token, updateUser } = useContext(AuthContext)!;
  const navigate = useNavigate();
  const [selectedActivity, setSelectedActivity] = useState(DEFAULT_EARN_OPTIONS[0]);
  const [customName, setCustomName] = useState('');
  const [duration, setDuration] = useState(20);
  const [ratio, setRatio] = useState(user?.min_per_coin_ratio || 1);
  const [loading, setLoading] = useState(false);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [recentEarnings, setRecentEarnings] = useState<Activity[]>([]);

  const allOptions = [...DEFAULT_EARN_OPTIONS, ...(user?.custom_earn_activities || []), 'Custom Activity...'];

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

    const isCustomInput = selectedActivity === 'Custom Activity...';
    const activityName = isCustomInput ? customName : selectedActivity;
    const pointsImpact = Math.round(duration * ratio);

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
          type: 'earn',
          activityName,
          durationMinutes: duration,
          pointsImpact,
          isCustom: isCustomInput
        }),
      });

      if (res.ok) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#fd9000', '#8a4c00', '#a7295a']
        });
        
        // Refetch profile to get updated coins and custom activities
        const profileRes = await fetch('/api/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profileData = await profileRes.json();
        updateUser(profileData);
        
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
          <p className="font-label text-sm uppercase tracking-widest opacity-80 mb-2">Today Earnings</p>
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
                {allOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant w-5 h-5" />
            </div>
            
            {/* Custom Activity List */}
            {(user?.custom_earn_activities || []).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {user?.custom_earn_activities?.map(act => (
                  <div key={act} className="flex items-center gap-1 bg-surface-container-high px-3 py-1.5 rounded-full text-xs font-bold text-on-surface-variant">
                    <span className="cursor-pointer" onClick={() => setSelectedActivity(act)}>{act}</span>
                  </div>
                ))}
              </div>
            )}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface-variant ml-1">Duration (min)</label>
              <div className="relative">
                <input 
                  type="number"
                  required
                  min="1"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full h-14 pl-4 pr-10 bg-surface-container-lowest border-none rounded-default focus:ring-2 focus:ring-primary font-medium shadow-sm"
                />
                <Timer className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 w-4 h-4" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface-variant ml-1">Ratio (pts/min)</label>
              <div className="relative">
                <input 
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={ratio}
                  onChange={(e) => setRatio(Math.round(Number(e.target.value)))}
                  className="w-full h-14 pl-4 pr-10 bg-surface-container-lowest border-none rounded-default focus:ring-2 focus:ring-primary font-medium shadow-sm"
                />
                <Coins className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex justify-between items-center">
            <span className="text-sm font-bold text-on-surface-variant">Estimated Points</span>
            <span className="text-2xl font-black text-primary">{Math.round(duration * ratio)}</span>
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

      {/* Recent Earnings Section - Table Format */}
      <section className="space-y-4 pb-8">
        <div className="flex justify-between items-end px-2">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-on-background font-headline">Recent Earnings</h2>
          </div>
          <Link to="/history" className="text-sm font-semibold text-secondary hover:underline">View All</Link>
        </div>
        
        <div className="bg-surface-container-low rounded-lg overflow-hidden p-1 shadow-sm">
          <div className="bg-surface-container-lowest rounded-default overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container text-on-surface-variant text-[11px] uppercase tracking-wider font-bold">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Activity</th>
                  <th className="px-4 py-3 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-100/50">
                {recentEarnings.map((activity) => (
                  <tr key={activity._id} className="hover:bg-orange-50/50 transition-colors">
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
                      <span className="text-xs font-bold text-tertiary">
                        +{Math.round(activity.pointsImpact)}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentEarnings.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-on-surface-variant text-sm">
                      No earnings yet today. Let's get started! 🚀
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
