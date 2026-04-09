import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useAnimation } from 'motion/react';
import { Stars, Gamepad2, Star } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AuthContext } from '../App.tsx';
import { LevelUpModal } from './LevelUpModal.tsx';
import { Activity } from '../types.ts';
import { cn } from '../lib/utils.ts';

export function Dashboard() {
  const { user, token } = useContext(AuthContext)!;
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [isLevelUpOpen, setIsLevelUpOpen] = useState(false);
  const prevLevelRef = useRef<number | null>(null);
  const controls = useAnimation();

  const level = Math.floor((user?.total_coins || 0) / 500) + 1;

  useEffect(() => {
    fetch('/api/activities/recent', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setRecentActivities(data));
  }, [token, user?.total_coins]);

  useEffect(() => {
    if (prevLevelRef.current !== null && level > prevLevelRef.current) {
      setIsLevelUpOpen(true);
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#fd9000', '#8a4c00', '#a7295a', '#4555a8']
      });
    }
    prevLevelRef.current = level;
  }, [level]);
  const progress = ((user?.total_coins || 0) % 500) / 500;
  const strokeDasharray = 2 * Math.PI * 110;
  const strokeDashoffset = strokeDasharray * (1 - progress);

  return (
    <div className="space-y-8 pt-8">
      <LevelUpModal 
        isOpen={isLevelUpOpen} 
        level={level} 
        onClose={() => setIsLevelUpOpen(false)} 
      />
      {/* Points Indicator */}
      <section className="flex flex-col items-center justify-center py-6">
        <div className="relative w-64 h-64 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle 
              className="text-surface-container" 
              cx="128" cy="128" r="110" 
              fill="transparent" stroke="currentColor" strokeWidth="24" 
            />
            <motion.circle 
              className="text-primary-container" 
              cx="128" cy="128" r="110" 
              fill="transparent" stroke="currentColor" strokeWidth="24" 
              strokeDasharray={strokeDasharray}
              initial={{ strokeDashoffset: strokeDasharray }}
              animate={{ strokeDashoffset }}
              strokeLinecap="round"
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          <motion.div 
            animate={controls}
            className="w-48 h-48 rounded-full bg-surface-container-lowest flex flex-col items-center justify-center shadow-xl ring-8 ring-orange-100/50"
          >
            <span className="text-xs font-bold text-on-surface-variant tracking-widest uppercase font-label">TOTAL POINTS</span>
            <span className="text-5xl font-extrabold text-primary tracking-tighter font-headline">
              {user?.total_coins || 0}
            </span>
            <div className="flex items-center gap-1 mt-2">
              <Star className="w-4 h-4 text-tertiary fill-current" />
              <span className="text-xs font-bold text-tertiary font-label">LEVEL {level}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <Link 
          to="/earn"
          className="h-[72px] bg-primary-container text-on-primary-container rounded-xl font-bold flex items-center justify-center gap-2 shadow-[0_8px_0_#8a4c00] active:shadow-none active:translate-y-[8px] transition-all hover:bg-primary-fixed-dim"
        >
          <Stars className="w-6 h-6 fill-current" />
          <span className="font-headline text-lg">EARN</span>
        </Link>
        <Link 
          to="/play"
          className="h-[72px] bg-secondary text-on-secondary rounded-xl font-bold flex items-center justify-center gap-2 shadow-[0_8px_0_#1a2b7e] active:shadow-none active:translate-y-[8px] transition-all hover:bg-secondary-dim"
        >
          <Gamepad2 className="w-6 h-6 fill-current" />
          <span className="font-headline text-lg">PLAY</span>
        </Link>
      </div>

      {/* Activity Log */}
      <section className="space-y-4">
        <div className="flex justify-between items-end px-2">
          <h2 className="text-xl font-bold text-on-background font-headline">Activity Log</h2>
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
                {recentActivities.map((activity) => (
                  <tr key={activity._id} className="hover:bg-orange-50/50 transition-colors">
                    <td className="px-4 py-4 text-xs font-medium">
                      {new Date(activity.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-on-surface">{activity.activityName}</span>
                        <span className="text-[10px] text-on-surface-variant font-medium">
                          {activity.type === 'earn' ? 'Habit Completed' : 'Game Reward'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={cn(
                        "text-xs font-bold",
                        activity.pointsImpact > 0 ? "text-tertiary" : "text-error"
                      )}>
                        {activity.pointsImpact > 0 ? `+${activity.pointsImpact}` : activity.pointsImpact}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentActivities.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-on-surface-variant text-sm">
                      No activities yet. Start earning!
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
