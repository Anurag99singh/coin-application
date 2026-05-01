import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stars, PlusCircle, ChevronDown, Clock3, Timer, Coins, ListChecks } from 'lucide-react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { AuthContext } from '../App.tsx';
import type { Activity, RewardMode } from '../types.ts';
import { cn } from '../lib/utils.ts';
import {
  readActivityFormPreferences,
  saveActivityFormPreferences
} from '../lib/activityFormPreferences.ts';

const DEFAULT_EARN_OPTIONS = [
  'Reading Time',
  'Math Exercises',
  'Piano Practice',
  'Cleaned Room',
  'Physical Play'
];

const CUSTOM_ACTIVITY_OPTION = 'Custom Activity...';

const EARN_FORM_DEFAULTS = {
  duration: 20,
  ratio: 1,
};

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

const formatEarnActivityDetail = (activity: Activity) => {
  if (activity.rewardMode === 'completion') {
    const completions = parsePositiveInteger(String(activity.completionCount || 1));
    const inferredPointsEach = completions > 0
      ? Math.round(Math.abs(activity.pointsImpact) / completions)
      : 1;
    const pointsEach = parsePositiveInteger(String(activity.pointsPerUnit || inferredPointsEach));

    return `${completions} ${completions === 1 ? 'time' : 'times'} x ${pointsEach} pts`;
  }

  return `${activity.durationMinutes} mins`;
};

export function Earn() {
  const { user, token, updateUser, openAuthModal } = useContext(AuthContext)!;
  const navigate = useNavigate();
  const userId = user?._id || 'guest';
  const [selectedActivity, setSelectedActivity] = useState(DEFAULT_EARN_OPTIONS[0]);
  const [customName, setCustomName] = useState('');
  const [rewardMode, setRewardMode] = useState<RewardMode>('timed');
  const [duration, setDuration] = useState(() => (
    String(readActivityFormPreferences('earn', userId, EARN_FORM_DEFAULTS).duration)
  ));
  const [ratio, setRatio] = useState(() => (
    String(readActivityFormPreferences('earn', userId, EARN_FORM_DEFAULTS).ratio)
  ));
  const [completionCount, setCompletionCount] = useState('1');
  const [loading, setLoading] = useState(false);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [recentEarnings, setRecentEarnings] = useState<Activity[]>([]);

  const savedCustomActivities = user?.custom_earn_activities || [];
  const allOptions = [...DEFAULT_EARN_OPTIONS, ...savedCustomActivities, CUSTOM_ACTIVITY_OPTION];
  const isCustomInput = selectedActivity === CUSTOM_ACTIVITY_OPTION;
  const isSavedCustomActivity = savedCustomActivities.includes(selectedActivity);
  const isCustomActivity = isCustomInput || isSavedCustomActivity;
  const activeRewardMode: RewardMode = isCustomActivity ? rewardMode : 'timed';
  const activeActivityName = (isCustomInput ? customName : selectedActivity).trim();
  const parsedDuration = parsePositiveInteger(duration, 0);
  const parsedRatio = parsePositiveInteger(ratio, 0);
  const parsedCompletionCount = parsePositiveInteger(completionCount, 0);
  const estimatedPoints = activeRewardMode === 'completion'
    ? Math.round(parsedCompletionCount * parsedRatio)
    : Math.round(parsedDuration * parsedRatio);

  useEffect(() => {
    if (!token) {
      setTodayEarnings(0);
      setRecentEarnings([]);
      return;
    }

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

  useEffect(() => {
    const parsedDuration = parsePositiveInteger(duration, 0);
    const parsedRatio = parsePositiveInteger(ratio, 0);

    if (parsedDuration > 0 && parsedRatio > 0) {
      saveActivityFormPreferences('earn', userId, {
        duration: parsedDuration,
        ratio: parsedRatio
      });
    }
  }, [duration, ratio, userId]);

  useEffect(() => {
    if (selectedActivity === CUSTOM_ACTIVITY_OPTION) {
      return;
    }

    const selectedRule = user?.custom_earn_activity_rules?.[selectedActivity];
    if (selectedRule) {
      setRewardMode(selectedRule.rewardMode);
      setRatio(String(selectedRule.pointsPerUnit));

      if (selectedRule.rewardMode === 'timed') {
        setDuration(String(selectedRule.defaultDurationMinutes || EARN_FORM_DEFAULTS.duration));
      }

      return;
    }

    if ((user?.custom_earn_activities || []).includes(selectedActivity)) {
      setRewardMode('timed');
    }
  }, [selectedActivity, user?.custom_earn_activity_rules, user?.custom_earn_activities]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !token) {
      openAuthModal();
      return;
    }

    const activityName = activeActivityName;
    if (!activityName) {
      return;
    }

    const selectedRewardMode = isCustomActivity ? rewardMode : 'timed';
    const durationMinutes = selectedRewardMode === 'completion' ? 0 : parsePositiveInteger(duration);
    const completionCountValue = selectedRewardMode === 'completion'
      ? parsePositiveInteger(completionCount)
      : undefined;
    const pointRatio = parsePositiveInteger(ratio);
    const pointsImpact = selectedRewardMode === 'completion'
      ? Math.round((completionCountValue || 1) * pointRatio)
      : Math.round(durationMinutes * pointRatio);
    const previousTotalCoins = Math.round(user?.total_coins || 0);

    setLoading(true);

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
          durationMinutes,
          pointsImpact,
          isCustom: isCustomActivity,
          rewardMode: selectedRewardMode,
          completionCount: completionCountValue,
          pointsPerUnit: pointRatio
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
        setTimeout(() => navigate('/', {
          state: {
            pointsDelta: pointsImpact,
            previousTotalCoins,
            animationKey: Date.now(),
          },
        }), 1500);
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
                onChange={(e) => {
                  setSelectedActivity(e.target.value);
                  if (e.target.value === CUSTOM_ACTIVITY_OPTION) {
                    setRewardMode('timed');
                  }
                }}
                className="w-full h-14 pl-4 pr-10 bg-surface-container-lowest border-none rounded-default focus:ring-2 focus:ring-primary appearance-none font-medium shadow-sm"
              >
                {allOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant w-5 h-5" />
            </div>
          </div>

          {isCustomInput && (
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

          {isCustomActivity && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <label className="block text-sm font-semibold text-on-surface-variant ml-1">Point Style</label>
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-surface-container-lowest p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setRewardMode('timed')}
                  className={cn(
                    'h-11 rounded-lg text-sm font-bold transition-all',
                    activeRewardMode === 'timed'
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-on-surface-variant'
                  )}
                >
                  Timed
                </button>
                <button
                  type="button"
                  onClick={() => setRewardMode('completion')}
                  className={cn(
                    'h-11 rounded-lg text-sm font-bold transition-all',
                    activeRewardMode === 'completion'
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-on-surface-variant'
                  )}
                >
                  Per Completion
                </button>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {activeRewardMode === 'completion' ? (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-on-surface-variant ml-1">Times completed</label>
                  <div className="relative">
                    <input 
                      type="text"
                      required
                      value={completionCount}
                      onChange={(e) => setCompletionCount(cleanPositiveIntegerText(e.target.value))}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="w-full h-14 pl-4 pr-10 bg-surface-container-lowest border-none rounded-default focus:ring-2 focus:ring-primary font-medium shadow-sm"
                    />
                    <ListChecks className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 w-4 h-4" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-on-surface-variant ml-1">Points each</label>
                  <div className="relative">
                    <input 
                      type="text"
                      required
                      value={ratio}
                      onChange={(e) => setRatio(cleanPositiveIntegerText(e.target.value))}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="w-full h-14 pl-4 pr-10 bg-surface-container-lowest border-none rounded-default focus:ring-2 focus:ring-primary font-medium shadow-sm"
                    />
                    <Coins className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 w-4 h-4" />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-on-surface-variant ml-1">Duration (min)</label>
                  <div className="relative">
                    <input 
                      type="text"
                      required
                      value={duration}
                      onChange={(e) => setDuration(cleanPositiveIntegerText(e.target.value))}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="w-full h-14 pl-4 pr-10 bg-surface-container-lowest border-none rounded-default focus:ring-2 focus:ring-primary font-medium shadow-sm"
                    />
                    <Timer className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 w-4 h-4" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-on-surface-variant ml-1">Points/min</label>
                  <div className="relative">
                    <input 
                      type="text"
                      required
                      value={ratio}
                      onChange={(e) => setRatio(cleanPositiveIntegerText(e.target.value))}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="w-full h-14 pl-4 pr-10 bg-surface-container-lowest border-none rounded-default focus:ring-2 focus:ring-primary font-medium shadow-sm"
                    />
                    <Coins className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 w-4 h-4" />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex justify-between items-center">
            <span className="text-sm font-bold text-on-surface-variant">Estimated Points</span>
            <span className="text-2xl font-black text-primary">
              {estimatedPoints}
            </span>
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
            <Clock3 className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-on-background font-headline">Recent Earnings</h2>
          </div>
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
                          {formatEarnActivityDetail(activity)}
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
                      No earnings yet today. Let's get started!
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
