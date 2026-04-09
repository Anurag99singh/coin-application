import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Trophy, X } from 'lucide-react';

interface LevelUpModalProps {
  isOpen: boolean;
  level: number;
  onClose: () => void;
}

export function LevelUpModal({ isOpen, level, onClose }: LevelUpModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 100 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-surface rounded-xl p-8 shadow-2xl z-[110] border-4 border-primary-container text-center overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary-container/30 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-tertiary/20 rounded-full blur-3xl animate-pulse" />

            <div className="relative z-10 space-y-6">
              <div className="flex justify-center">
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-primary-container/20 rounded-full scale-150 blur-xl"
                  />
                  <div className="bg-primary-container p-6 rounded-full shadow-lg relative">
                    <Trophy className="w-12 h-12 text-white" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-black text-primary font-headline uppercase tracking-tight">Level Up!</h2>
                <p className="text-on-surface-variant font-bold">You've reached a new milestone!</p>
              </div>

              <div className="bg-surface-container-low p-4 rounded-xl border-2 border-primary/10">
                <span className="text-xs font-black text-on-surface-variant uppercase tracking-widest">New Rank</span>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <Star className="w-6 h-6 text-tertiary fill-current" />
                  <span className="text-4xl font-black text-tertiary font-headline">LEVEL {level}</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full h-14 bg-primary text-on-primary font-bold rounded-xl shadow-lg active:scale-95 transition-all text-lg"
              >
                Keep Going!
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
