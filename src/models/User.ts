import mongoose from 'mongoose';

const customEarnActivityRuleSchema = new mongoose.Schema({
  rewardMode: { type: String, enum: ['timed', 'completion'], default: 'timed' },
  pointsPerUnit: { type: Number, default: 1 },
  defaultDurationMinutes: { type: Number, default: 20 },
}, { _id: false });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  total_coins: { type: Number, default: 0 },
  min_per_coin_ratio: { type: Number, default: 1 },
  custom_earn_activities: { type: [String], default: [] },
  custom_earn_activity_rules: { type: Map, of: customEarnActivityRuleSchema, default: {} },
  custom_play_activities: { type: [String], default: [] },
  surprises: { type: Map, of: String, default: {} },
  surprise_goal_points: { type: Number, default: 500 },
  surprise_reward_name: { type: String, default: 'Mystery Surprise' },
  surprise_cycle_start_points: { type: Number, default: 0 },
  surprise_cycle_points: { type: Number, default: 0 },
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);
