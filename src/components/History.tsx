import React, { useState, useEffect, useContext } from 'react';
import { Coins, CheckCircle, Gamepad2, Book, Trash2, Utensils, Brush, History as HistoryIcon } from 'lucide-react';
import { AuthContext } from '../App.tsx';
import { Activity } from '../types.ts';
import { cn } from '../lib/utils.ts';

const ICON_MAP: Record<string, any> = {
  'Reading': Book,
  'Math': Book,
  'Cleaning': Trash2,
  'Piano': Brush,
  'Space Explorer': Gamepad2,
  'default': HistoryIcon
};

export function History() {
  const { user, token } = useContext(AuthContext)!;
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    fetch('/api/activities/history', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setActivities(data));
  }, [token]);

  const totalEarned = activities
    .filter(a => a.type === 'earn')
    .reduce((sum, a) => sum + a.pointsImpact, 0);
  const totalSpent = activities
    .filter(a => a.type === 'spend')
    .reduce((sum, a) => sum + Math.abs(a.pointsImpact), 0);

  return (
    <div className="pt-4 space-y-8">
      {/* Summary Card */}
      <div className="bg-surface-container-highest rounded-lg p-6 flex flex-col items-center text-center relative overflow-hidden shadow-sm">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-container/20 rounded-full blur-3xl"></div>
        <h2 className="text-on-surface-variant font-label font-bold text-sm uppercase tracking-widest mb-2">Lifetime Balance</h2>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-primary font-headline font-extrabold text-5xl">{user?.total_coins || 0}</span>
          <Coins className="w-8 h-8 text-primary fill-current" />
        </div>
        <div className="w-full h-1 bg-primary/10 rounded-full mb-4"></div>
        <div className="flex justify-around w-full">
          <div className="flex flex-col">
            <span className="text-on-surface font-headline font-bold text-xl">{totalEarned}</span>
            <span className="text-on-surface-variant text-xs font-medium">Earned</span>
          </div>
          <div className="w-[1px] bg-primary/10 h-8 self-center"></div>
          <div className="flex flex-col">
            <span className="text-on-surface font-headline font-bold text-xl">{totalSpent}</span>
            <span className="text-on-surface-variant text-xs font-medium">Spent</span>
          </div>
        </div>
      </div>

      {/* List Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-headline font-bold text-lg text-on-background">History Logs</h3>
        <button className="text-primary font-label font-bold text-sm bg-primary-container/10 px-4 py-2 rounded-full">Filter</button>
      </div>

      {/* Activity List */}
      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = ICON_MAP[activity.activityName.split(' ')[0]] || ICON_MAP['default'];
          const isGain = activity.pointsImpact > 0;
          
          return (
            <div key={activity._id} className="bg-surface-container-low rounded-lg p-4 flex items-center gap-4 hover:bg-surface-container transition-colors shadow-sm">
              <div className={cn(
                "p-3 rounded-full flex items-center justify-center",
                isGain ? "bg-primary-container/20" : "bg-tertiary-container/20"
              )}>
                <Icon className={cn("w-6 h-6", isGain ? "text-primary" : "text-tertiary")} />
              </div>
              <div className="flex-1">
                <p className="text-on-surface font-semibold">{activity.activityName}</p>
                <p className="text-on-surface-variant text-xs">
                  {new Date(activity.createdAt).toLocaleString(undefined, { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className={cn(
                  "font-headline font-bold",
                  isGain ? "text-primary" : "text-tertiary"
                )}>
                  {isGain ? `+${activity.pointsImpact}` : activity.pointsImpact}
                </p>
                <p className={cn(
                  "text-[10px] uppercase font-bold tracking-tighter",
                  isGain ? "text-primary/60" : "text-tertiary/60"
                )}>
                  {isGain ? 'Points' : 'Spent'}
                </p>
              </div>
            </div>
          );
        })}
        {activities.length === 0 && (
          <div className="text-center py-12 text-on-surface-variant">
            No history yet.
          </div>
        )}
      </div>

      <button className="w-full mt-8 mb-4 py-4 rounded-xl border-2 border-dashed border-outline-variant/30 text-outline font-bold hover:bg-surface-container-low transition-all">
        View Older History
      </button>
    </div>
  );
}
