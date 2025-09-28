import Redis from 'ioredis';

// A minimal Redis-like interface used across the codebase
export type RedisLike = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ...args: any[]): Promise<'OK'>;
  setex(key: string, seconds: number, value: string): Promise<'OK'>;
  del(key: string): Promise<number>;
  on(event: 'error' | 'connect', listener: (...args: any[]) => void): void;
};

// In-memory mock that supports the subset of commands we use (get, set, setex, del)
class InMemoryRedis implements RedisLike {
  private store = new Map<string, { value: string; expiresAt?: number }>();
  private timeouts = new Map<string, NodeJS.Timeout>();

  private deleteKey(key: string) {
    this.store.delete(key);
    const t = this.timeouts.get(key);
    if (t) {
      clearTimeout(t);
      this.timeouts.delete(key);
    }
  }

  private setWithExpiry(key: string, value: string, ms?: number) {
    this.deleteKey(key);
    const expiresAt = ms ? Date.now() + ms : undefined;
    this.store.set(key, { value, expiresAt });
    if (ms) {
      const to = setTimeout(() => this.deleteKey(key), ms);
      this.timeouts.set(key, to);
    }
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.deleteKey(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ...args: any[]): Promise<'OK'> {
    // Support "EX <seconds>" option like ioredis
    const exIdx = args.findIndex((a) => String(a).toUpperCase() === 'EX');
    if (exIdx >= 0 && args.length > exIdx + 1) {
      const seconds = Number(args[exIdx + 1]);
      const ms = isFinite(seconds) ? seconds * 1000 : undefined;
      this.setWithExpiry(key, value, ms);
    } else {
      this.setWithExpiry(key, value);
    }
    return 'OK';
  }

  async setex(key: string, seconds: number, value: string): Promise<'OK'> {
    this.setWithExpiry(key, value, seconds * 1000);
    return 'OK';
  }

  async del(key: string): Promise<number> {
    const existed = this.store.has(key);
    this.deleteKey(key);
    return existed ? 1 : 0;
  }

  on(_event: 'error' | 'connect', _listener: (...args: any[]) => void): void {
    // no-op for mock
  }
}

const env = process.env.NODE_ENV || 'development';
const explicitlyEnable = ['1', 'true', 'yes'].includes(String(process.env.USE_REDIS || '').toLowerCase());
const explicitlyDisable = ['1', 'true', 'yes'].includes(String(process.env.DISABLE_REDIS || '').toLowerCase());
const useMockByDefault = env !== 'production' && !explicitlyEnable;
const useMock = explicitlyDisable || useMockByDefault;

let redis: RedisLike;

if (useMock) {
  console.log(`[Redis] Using in-memory mock (env=${env}${explicitlyDisable ? ', forced by DISABLE_REDIS' : useMockByDefault ? ', default in non-production' : ''}).`);
  redis = new InMemoryRedis();
} else {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  const client = new Redis(url, {
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
  });

  client.on('error', (err) => {
    console.error('Redis connection error:', err);
  });

  client.on('connect', () => {
    console.log('Connected to Redis');
  });

  redis = client as unknown as RedisLike;
}

export { redis };
