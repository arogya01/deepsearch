import Redis from 'ioredis';

// Types for cached data
interface CachedUserData {
  id: number;
  clerkId: string;
  name: string;
  email: string;
  profileImageUrl: string | null;
  subscriptionTier: string;
  preferences: {
    theme?: 'light' | 'dark';
    language?: string;
    notifications?: boolean;
  };
  lastActiveAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CachedSessionData {
  [key: string]: unknown;
}

// Redis client singleton
let redis: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redis = new Redis(redisUrl, {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    redis.on('connect', () => {
      console.log('Redis connected successfully');
    });

    redis.on('error', (error) => {
      console.error('Redis connection error:', error);
    });
  }

  return redis;
}

// User data caching utilities
export class UserCache {
  private redis: Redis;
  private readonly TTL = 3600; // 1 hour

  constructor() {
    this.redis = getRedisClient();
  }

  private getUserKey(clerkId: string): string {
    return `user:${clerkId}`;
  }

  private getSessionKey(clerkId: string): string {
    return `session:${clerkId}`;
  }

  /**
   * Cache user data
   */
  async setUser(clerkId: string, userData: CachedUserData): Promise<void> {
    const key = this.getUserKey(clerkId);
    await this.redis.setex(key, this.TTL, JSON.stringify(userData));
  }

  /**
   * Get cached user data
   */
  async getUser(clerkId: string): Promise<CachedUserData | null> {
    const key = this.getUserKey(clerkId);
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  /**
   * Remove user from cache
   */
  async deleteUser(clerkId: string): Promise<void> {
    const userKey = this.getUserKey(clerkId);
    const sessionKey = this.getSessionKey(clerkId);
    await this.redis.del(userKey, sessionKey);
  }

  /**
   * Cache user session data
   */
  async setSession(clerkId: string, sessionData: CachedSessionData): Promise<void> {
    const key = this.getSessionKey(clerkId);
    await this.redis.setex(key, this.TTL, JSON.stringify(sessionData));
  }

  /**
   * Get cached session data
   */
  async getSession(clerkId: string): Promise<CachedSessionData | null> {
    const key = this.getSessionKey(clerkId);
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  /**
   * Update user's last active timestamp
   */
  async updateLastActive(clerkId: string): Promise<void> {
    const key = `lastactive:${clerkId}`;
    await this.redis.setex(key, 86400, Date.now().toString()); // 24 hours
  }

  /**
   * Rate limiting for API calls
   */
  async isRateLimited(clerkId: string, endpoint: string, limit: number = 60, window: number = 3600): Promise<boolean> {
    const key = `ratelimit:${clerkId}:${endpoint}`;
    const current = await this.redis.incr(key);
    
    if (current === 1) {
      await this.redis.expire(key, window);
    }
    
    return current > limit;
  }
}

// Export singleton instance
export const userCache = new UserCache();

