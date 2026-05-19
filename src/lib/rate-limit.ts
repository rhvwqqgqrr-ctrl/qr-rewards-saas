import redis from "./redis";

interface RateLimitConfig {
  key: string;
  limit: number;
  windowSeconds: number;
}

export async function checkRateLimit(config: RateLimitConfig): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: number;
}> {
  const { key, limit, windowSeconds } = config;
  const now = Math.floor(Date.now() / 1000);
  const windowKey = `rl:${key}:${Math.floor(now / windowSeconds)}`;

  const multi = redis.multi();
  multi.incr(windowKey);
  multi.expire(windowKey, windowSeconds);
  const results = await multi.exec();

  const count = (results?.[0]?.[1] as number) || 0;
  const remaining = Math.max(0, limit - count);
  const resetAt = (Math.floor(now / windowSeconds) + 1) * windowSeconds;

  return {
    allowed: count <= limit,
    remaining,
    resetAt,
  };
}

export async function acquireLock(
  key: string,
  ttlMs: number = 5000
): Promise<boolean> {
  const result = await redis.set(`lock:${key}`, "1", "PX", ttlMs, "NX");
  return result === "OK";
}

export async function releaseLock(key: string): Promise<void> {
  await redis.del(`lock:${key}`);
}
