import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { User } from './src/models/User.ts';
import { Activity } from './src/models/Activity.ts';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/habithero';

app.use(cors());
app.use(express.json());

// Middleware to verify JWT
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.user = user;
    next();
  });
};

const mapToObject = (value: any) => {
  if (!value) return {};
  if (value instanceof Map) return Object.fromEntries(value);
  if (typeof value.toObject === 'function') return value.toObject();
  return value;
};

const serializeUser = (user: any) => {
  const totalCoins = Math.round(Math.max(0, Number(user.total_coins) || 0));
  const cycleStart = Math.round(Math.max(0, Number(user.surprise_cycle_start_points) || 0));
  const legacyCyclePoints = Math.max(0, totalCoins - cycleStart);
  const cyclePoints = user.surprise_cycle_points === undefined || user.surprise_cycle_points === null
    ? legacyCyclePoints
    : Math.round(Math.max(0, Number(user.surprise_cycle_points) || 0));

  return {
    _id: user._id,
    username: user.username,
    total_coins: totalCoins,
    min_per_coin_ratio: user.min_per_coin_ratio ?? 1,
    custom_earn_activities: user.custom_earn_activities ?? [],
    custom_play_activities: user.custom_play_activities ?? [],
    surprises: mapToObject(user.surprises),
    surprise_goal_points: user.surprise_goal_points ?? 500,
    surprise_reward_name: user.surprise_reward_name || 'Mystery Surprise',
    surprise_cycle_start_points: cycleStart,
    surprise_cycle_points: cyclePoints,
  };
};

async function startServer() {
  // Connect to MongoDB
  try {
    if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('localhost')) {
      console.warn('⚠️ WARNING: No remote MONGODB_URI found in environment variables.');
      console.warn('To fix the "buffering timed out" error, please add your MongoDB Atlas connection string to the Secrets panel as MONGODB_URI.');
    }

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Fail faster (5s instead of 30s)
      connectTimeoutMS: 10000,
    });
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    console.error('Please ensure your MONGODB_URI is correct and your IP address is whitelisted in MongoDB Atlas.');
  }

  // Auth Routes
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { username, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ username, password: hashedPassword });
      await user.save();
      const token = jwt.sign({ userId: user._id }, JWT_SECRET);
      res.json({ user: serializeUser(user), token });
    } catch (err: any) {
      if (err.code === 11000) {
        return res.status(400).json({ error: 'Username already exists. Please choose another one.' });
      }
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await (User as any).findOne({ username });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const token = jwt.sign({ userId: user._id }, JWT_SECRET);
      res.json({ user: serializeUser(user), token });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Profile Routes
  app.get('/api/profile', authenticateToken, async (req: any, res) => {
    try {
      const user = await (User as any).findById(req.user.userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(serializeUser(user));
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch('/api/profile/surprise-goal', authenticateToken, async (req: any, res) => {
    try {
      const { surprise_goal_points, surprise_reward_name, password } = req.body;
      if (password !== 'pari') {
        return res.status(403).json({ error: 'Incorrect parental password' });
      }

      const targetPoints = Math.max(1, Math.round(Number(surprise_goal_points) || 500));
      const rewardName = typeof surprise_reward_name === 'string' && surprise_reward_name.trim()
        ? surprise_reward_name.trim()
        : 'Mystery Surprise';

      const user = await (User as any).findByIdAndUpdate(
        req.user.userId,
        {
          surprise_goal_points: targetPoints,
          surprise_reward_name: rewardName
        },
        { returnDocument: 'after' }
      );
      if (!user) return res.status(404).json({ error: 'User not found' });

      res.json(serializeUser(user));
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/profile/claim-surprise', authenticateToken, async (req: any, res) => {
    try {
      const user = await (User as any).findById(req.user.userId);
      if (!user) return res.status(404).json({ error: 'User not found' });

      const totalCoins = Math.round(Math.max(0, Number(user.total_coins) || 0));
      const cycleStart = Math.round(Math.max(0, Number(user.surprise_cycle_start_points) || 0));
      const goalPoints = Math.max(1, Math.round(Number(user.surprise_goal_points) || 500));
      const legacyCyclePoints = Math.max(0, totalCoins - cycleStart);
      const cyclePoints = user.surprise_cycle_points === undefined || user.surprise_cycle_points === null
        ? legacyCyclePoints
        : Math.round(Math.max(0, Number(user.surprise_cycle_points) || 0));

      if (cyclePoints < goalPoints) {
        return res.status(400).json({ error: 'Surprise is not unlocked yet.' });
      }

      const rewardName = typeof user.surprise_reward_name === 'string' && user.surprise_reward_name.trim()
        ? user.surprise_reward_name.trim()
        : 'Mystery Surprise';

      user.surprise_cycle_start_points = totalCoins;
      user.surprise_cycle_points = 0;
      await user.save();

      res.json({ user: serializeUser(user), rewardName });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch('/api/profile/surprises', authenticateToken, async (req: any, res) => {
    try {
      const { surprises, password } = req.body;
      if (password !== 'pari') {
        return res.status(403).json({ error: 'Incorrect parental password' });
      }
      const user = await (User as any).findByIdAndUpdate(
        req.user.userId,
        { surprises },
        { returnDocument: 'after' }
      );
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(serializeUser(user));
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch('/api/profile/ratio', authenticateToken, async (req: any, res) => {
    try {
      const { ratio } = req.body;
      const user = await (User as any).findByIdAndUpdate(
        req.user.userId,
        { min_per_coin_ratio: ratio },
        { returnDocument: 'after' }
      );
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(serializeUser(user));
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/profile/custom-activity', authenticateToken, async (req: any, res) => {
    try {
      const { type, activityName } = req.body;
      const field = type === 'earn' ? 'custom_earn_activities' : 'custom_play_activities';
      const user = await (User as any).findByIdAndUpdate(
        req.user.userId,
        { $pull: { [field]: activityName } },
        { returnDocument: 'after' }
      );
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(serializeUser(user));
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Activity Routes
  app.post('/api/activities', authenticateToken, async (req: any, res) => {
    try {
      const { type, activityName, durationMinutes, pointsImpact, isCustom } = req.body;
      const activity = new Activity({
        userId: req.user.userId,
        type,
        activityName,
        durationMinutes,
        pointsImpact
      });
      await activity.save();

      // Update user total coins and optionally add custom activity
      const update: any = { $inc: { total_coins: pointsImpact } };
      if (type === 'earn' && pointsImpact > 0) {
        update.$inc.surprise_cycle_points = Math.round(pointsImpact);
      }
      if (isCustom) {
        const field = type === 'earn' ? 'custom_earn_activities' : 'custom_play_activities';
        update.$addToSet = { [field]: activityName };
      }

      await (User as any).findByIdAndUpdate(req.user.userId, update);

      res.json(activity);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/activities/:activityId', authenticateToken, async (req: any, res) => {
    try {
      const activity = await (Activity as any).findOne({
        _id: req.params.activityId,
        userId: req.user.userId
      });
      if (!activity) return res.status(404).json({ error: 'Activity not found' });

      const user = await (User as any).findById(req.user.userId);
      if (!user) return res.status(404).json({ error: 'User not found' });

      const pointsImpact = Math.round(Number(activity.pointsImpact) || 0);
      const currentTotalCoins = Math.round(Math.max(0, Number(user.total_coins) || 0));
      const cycleStart = Math.round(Math.max(0, Number(user.surprise_cycle_start_points) || 0));
      const legacyCyclePoints = Math.max(0, currentTotalCoins - cycleStart);
      const currentCyclePoints = user.surprise_cycle_points === undefined || user.surprise_cycle_points === null
        ? legacyCyclePoints
        : Math.round(Math.max(0, Number(user.surprise_cycle_points) || 0));

      user.total_coins = Math.max(0, currentTotalCoins - pointsImpact);

      if (activity.type === 'earn' && pointsImpact > 0) {
        user.surprise_cycle_points = Math.max(0, currentCyclePoints - pointsImpact);
      }

      await user.save();
      await activity.deleteOne();

      res.json({ user: serializeUser(user), deletedActivityId: activity._id });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/activities/recent', authenticateToken, async (req: any, res) => {
    try {
      const activities = await (Activity as any).find({ userId: req.user.userId })
        .sort({ createdAt: -1 })
        .limit(5);
      res.json(activities);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/activities/recent/:type', authenticateToken, async (req: any, res) => {
    try {
      const { type } = req.params;
      const activities = await (Activity as any).find({ 
        userId: req.user.userId,
        type 
      })
        .sort({ createdAt: -1 })
        .limit(3);
      res.json(activities);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/activities/today-earnings', authenticateToken, async (req: any, res) => {
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      
      const activities = await (Activity as any).find({
        userId: req.user.userId,
        type: 'earn',
        createdAt: { $gte: startOfDay }
      });
      
      const earnings = activities.reduce((sum: number, a: any) => sum + a.pointsImpact, 0);
      res.json({ earnings });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API route not found. Please restart the app server if this route was just added.' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
