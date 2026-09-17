const Redis = require('ioredis');

/**
 * Production Redis Client Setup.
 * 
 * Why Redis?
 * In music streaming platforms, frequently requested catalogs (e.g., "Top 20 Tracks",
 * "Trending Now") receive thousands of read requests per minute. Querying MongoDB
 * repeatedly degrades performance. We cache the JSON payload in Redis with a 60-second TTL.
 * 
 * Fallback Resilience:
 * If Redis is offline, we catch the error, log a warning, and allow the application
 * to fall back directly to primary database queries without throwing a 500 error to users.
 */
let redisClient = null;
let isRedisAvailable = false;

try {
  redisClient = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null // Don't hang on connection attempts if offline
  });

  redisClient.connect().then(() => {
    isRedisAvailable = true;
    console.log('[Cache] Redis connected successfully. In-memory caching active.');
  }).catch((err) => {
    isRedisAvailable = false;
    console.warn(`[Cache Notice] Redis unavailable (${err.message}). Falling back to direct database queries.`);
  });

  redisClient.on('error', () => {
    isRedisAvailable = false;
  });
} catch (err) {
  isRedisAvailable = false;
  console.warn('[Cache Notice] Redis initialization skipped. Memory fallback enabled.');
}

const getCache = async (key) => {
  if (!isRedisAvailable || !redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    return null;
  }
};

const setCache = async (key, value, ttlSeconds = 60) => {
  if (!isRedisAvailable || !redisClient) return;
  try {
    await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (err) {
    // Silently continue if cache write fails
  }
};

const invalidateCache = async (key) => {
  if (!isRedisAvailable || !redisClient) return;
  try {
    await redisClient.del(key);
  } catch (err) {
    // Ignore error
  }
};

module.exports = {
  redisClient,
  isRedisConnected: () => isRedisAvailable,
  getCache,
  setCache,
  invalidateCache
};
