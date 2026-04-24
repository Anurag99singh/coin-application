import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Stars, Gamepad2, Star, Lock, Gift, Smile, Leaf, Trophy, PlusCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AuthContext } from '../App.tsx';
import { Activity } from '../types.ts';
import { cn } from '../lib/utils.ts';

const LEVEL_THRESHOLD = 150;

const Star3D: React.FC<{ filled: boolean; levelNum: number; icon?: any }> = ({ filled, levelNum, icon: Icon }) => {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-14 h-14 flex items-center justify-center">
        {filled ? (
          <>
            <svg viewBox="0 0 24 24" className="w-full h-full text-[#f58200] drop-shadow-md" fill="currentColor">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center mt-1">
              {Icon ? <Icon className="w-5 h-5 text-white" /> : <Star className="w-5 h-5 text-white fill-current" />}
            </div>
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" className="w-full h-full text-[#e2dcd0]" fill="currentColor">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center mt-1">
              <Lock className="w-4 h-4 text-[#b0a898]" />
            </div>
          </>
        )}
      </div>
      <span className={cn("text-xs font-bold", filled ? "text-[#9a5b00]" : "text-[#b0a898]")}>LV {levelNum}</span>
    </div>
  );
};

export function Dashboard() {
  const { user, token } = useContext(AuthContext)!;
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [isLevelUpOpen, setIsLevelUpOpen] = useState(false);
  const prevLevelRef = useRef<number | null>(null);

  const totalCoins = Math.max(0, user?.total_coins || 0);
  
  let tempCoins = totalCoins;
  let calcLevel = 1;
  let xpRequired = 100;

  while (tempCoins >= xpRequired) {
    tempCoins -= xpRequired;
    calcLevel++;
    xpRequired += 50;
  }

  const level = calcLevel;
  const currentXP = tempCoins;
  const LEVEL_THRESHOLD = xpRequired;
  const progressPercent = (currentXP / LEVEL_THRESHOLD) * 100;

  useEffect(() => {
    fetch('/api/activities/recent', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setRecentActivities(data));
  }, [token, totalCoins]);

  useEffect(() => {
    if (prevLevelRef.current !== null && level > prevLevelRef.current) {
      setIsLevelUpOpen(true);
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#f58200', '#e07600', '#ec4899', '#4555a8']
      });
    }
    prevLevelRef.current = level;
  }, [level]);

  const displayLevel = ((level - 1) % 5) + 1;
  const baseLevel = Math.floor((level - 1) / 5) * 5;

  const getIconForStar = (idx: number) => {
    if (idx === 0) return Smile;
    if (idx === 1) return Leaf;
    return Star;
  };

  const defaultSurprises: Record<string, string> = {
    '1': 'Extra 15 mins screen time!',
    '2': 'Special dessert tonight!',
    '3': 'New small toy!',
    '4': 'Trip to the park!',
    '5': 'Choose a movie for family night!'
  };
  const surprises = user?.surprises && Object.keys(user.surprises).length > 0 ? user.surprises : defaultSurprises;
  const currentSurprise = surprises[level.toString()] || 'A mystery gift!';

  return (
    <div className="space-y-8 pt-8 pb-12">
      {/* Hero Image & Points */}
      <section className="relative flex flex-col items-center justify-center pt-2 pb-8">
        <div className="relative w-full max-w-[240px] aspect-square">
          {/* Decorative glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#f58200] to-[#ec4899] rounded-full blur-3xl opacity-30 animate-pulse" />
          
          {/* Image Container */}
          <div className="relative w-full h-full rounded-[3rem] overflow-hidden border-8 border-white shadow-2xl bg-[#fcdcb5]">
            <img 
              src="/coing.png" 
              alt="Hero Character"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      {/* Milestones Card */}
      <section className="bg-[#f9f4e8] rounded-3xl p-6 shadow-sm border border-[#e8dfce]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-extrabold text-[#6b5e4a] tracking-wider uppercase">Your Milestones</h3>
          <span className="text-sm font-extrabold text-[#9a5b00]">LEVEL {level}</span>
        </div>
        <div className="overflow-hidden px-2 py-4 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={baseLevel}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex justify-between items-center"
            >
              {[0, 1, 2, 3, 4].map((idx) => {
                const starLevelNum = baseLevel + idx + 1;
                const isFilled = level > starLevelNum || (level === starLevelNum && currentXP >= 0);
                return (
                  <Star3D 
                    key={starLevelNum} 
                    filled={isFilled} 
                    levelNum={starLevelNum} 
                    icon={getIconForStar(idx)} 
                  />
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Surprise Reward Progress */}
      <section className="space-y-3">
        <div className="flex justify-between items-end px-1">
          <h3 className="text-lg font-black text-[#c2185b] flex items-center gap-2 uppercase tracking-tight">
            <Gift className="w-6 h-6 fill-current text-[#f58200]" />
            Surprise Reward
          </h3>
          <span className="text-sm font-bold text-[#8a4c00]">
            {currentXP} / {LEVEL_THRESHOLD}
          </span>
        </div>

        <div className="h-14 w-full bg-[#e6c59c] rounded-full p-1.5 shadow-[inset_0_4px_8px_rgba(138,76,0,0.3)] relative overflow-hidden border-b-4 border-white/50">
          <motion.div
            className="h-full rounded-full relative overflow-hidden shadow-[inset_0_-4px_6px_rgba(0,0,0,0.2),inset_0_4px_6px_rgba(255,255,255,0.4)]"
            style={{
              background: 'linear-gradient(180deg, #f43f5e 0%, #e11d48 50%, #be123c 100%)',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ type: 'spring', bounce: 0.2, duration: 1.5 }}
          >
            {/* 3D Shine overlay */}
            <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 to-transparent rounded-t-full" />
            {/* Animated Stripes overlay */}
            <motion.div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 15px, #ffffff 15px, #ffffff 30px)',
                backgroundSize: '42px 42px',
                width: '200%'
              }}
              animate={{ x: ['-42px', '0px'] }}
              transition={{ repeat: Infinity, ease: 'linear', duration: 1 }}
            />
          </motion.div>
        </div>
        <p className="text-center text-xs font-bold text-[#8a4c00] italic">
          Charging up... Earn more to unlock the mystery!
        </p>
      </section>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4 pt-2">
        <Link 
          to="/earn"
          className="h-[72px] bg-[#f58200] text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-[0_6px_0_#c26600] active:shadow-none active:translate-y-[6px] transition-all hover:bg-[#e07600]"
        >
          <div className="bg-black/20 rounded-full p-1">
            <PlusCircle className="w-5 h-5" />
          </div>
          <span className="font-headline text-xl">Earn</span>
        </Link>
        <Link 
          to="/spend"
          className="h-[72px] bg-[#4555a8] text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-[0_6px_0_#2d3770] active:shadow-none active:translate-y-[6px] transition-all hover:bg-[#3b488f]"
        >
          <div className="bg-white/20 rounded-full p-1">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <span className="font-headline text-xl">Spend</span>
        </Link>
      </div>

      {/* Activity Log */}
      <section className="space-y-4 pt-4">
        <div className="flex justify-between items-end px-2">
          <h2 className="text-2xl font-black text-[#4a3f35] font-headline">Activity Log</h2>
          <Link to="/history" className="text-sm font-bold text-[#4555a8] hover:underline">View All</Link>
        </div>
        <div className="bg-[#f9f4e8] rounded-2xl overflow-hidden p-1 shadow-sm border border-[#e8dfce]">
          <div className="bg-white rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#fcdcb5]/30 text-[#8a4c00] text-[11px] uppercase tracking-wider font-extrabold">
                  <th className="px-4 py-4">Date</th>
                  <th className="px-4 py-4">Activity</th>
                  <th className="px-4 py-4 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#fcdcb5]/30">
                {recentActivities.map((activity) => (
                  <tr key={activity._id} className="hover:bg-[#fcdcb5]/10 transition-colors">
                    <td className="px-4 py-4 text-xs font-bold text-[#6b5e4a]">
                      {new Date(activity.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-extrabold text-[#4a3f35]">{activity.activityName}</span>
                        <span className="text-[10px] text-[#8a4c00] font-bold">
                          {activity.type === 'earn' ? 'Daily Habit ✏️' : 'Game Reward 🎮'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={cn(
                        "text-sm font-black",
                        activity.pointsImpact > 0 ? "text-[#c2185b]" : "text-[#4555a8]"
                      )}>
                        {activity.pointsImpact > 0 ? `+${activity.pointsImpact}` : activity.pointsImpact}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentActivities.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-[#8a4c00] font-bold text-sm">
                      No activities yet. Start earning!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Level Up Modal */}
      <AnimatePresence>
        {isLevelUpOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setIsLevelUpOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.5, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 100 }}
              className="relative bg-white rounded-[3rem] p-8 text-center shadow-2xl border-4 border-[#f58200] max-w-sm w-full"
            >
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#f58200] rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                <Gift className="w-16 h-16 text-white fill-current" />
              </div>
              <div className="mt-12 space-y-4">
                <h2 className="text-3xl font-black text-[#c2185b] font-headline uppercase">Surprise Unlocked!</h2>
                <p className="text-lg font-bold text-[#6b5e4a]">You've reached Level {level}!</p>
                <div className="bg-[#fcdcb5]/30 p-6 rounded-2xl border-2 border-dashed border-[#f58200]/50">
                  <p className="text-xs font-black text-[#f58200] uppercase mb-2">Your Reward</p>
                  <p className="text-xl font-black text-[#8a4c00]">{currentSurprise}</p>
                </div>
                <button 
                  onClick={() => setIsLevelUpOpen(false)}
                  className="w-full h-14 bg-[#f58200] text-white font-bold rounded-2xl shadow-[0_6px_0_#c26600] active:shadow-none active:translate-y-[6px] transition-all text-lg"
                >
                  Awesome! 🚀
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

