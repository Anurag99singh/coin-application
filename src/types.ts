export interface User {
  _id: string;
  username: string;
  total_coins: number;
  min_per_coin_ratio: number;
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
