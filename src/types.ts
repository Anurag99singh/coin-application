export interface User {
  _id: string;
  username: string;
  total_coins: number;
  min_per_coin_ratio: number;
  custom_earn_activities?: string[];
  custom_play_activities?: string[];
  surprises?: Record<string, string>;
  surprise_goal_points?: number;
  surprise_reward_name?: string;
  surprise_cycle_start_points?: number;
  surprise_cycle_points?: number;
}

export interface Activity {
  _id: string;
  userId: string;
  type: 'earn' | 'spend';
  activityName: string;
  durationMinutes: number;
  pointsImpact: number;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
