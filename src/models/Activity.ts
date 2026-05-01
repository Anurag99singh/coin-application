import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['earn', 'spend'], required: true },
  activityName: { type: String, required: true },
  durationMinutes: { type: Number, required: true },
  pointsImpact: { type: Number, required: true },
  rewardMode: { type: String, enum: ['timed', 'completion'], default: 'timed' },
  completionCount: { type: Number },
  pointsPerUnit: { type: Number },
  createdAt: { type: Date, default: Date.now },
});

export const Activity = mongoose.models.Activity || mongoose.model('Activity', activitySchema);
