import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  total_coins: { type: Number, default: 0 },
  min_per_coin_ratio: { type: Number, default: 1 },
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);
