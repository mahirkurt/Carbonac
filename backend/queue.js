import './env.js';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const skipVersionCheck = ['1', 'true', 'yes'].includes(
  (process.env.REDIS_SKIP_VERSION_CHECK || '').toLowerCase()
);

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    if (times > 20) {
      console.error(`[queue] Redis reconnect failed after ${times} attempts, giving up`);
      return null;
    }
    const delay = Math.min(times * 200, 5000);
    console.warn(`[queue] Redis reconnecting (attempt ${times}, delay ${delay}ms)`);
    return delay;
  },
  reconnectOnError(err) {
    return err.message.includes('READONLY');
  },
});

const queueName = process.env.JOB_QUEUE_NAME || 'carbonac-jobs';
const jobQueue = new Queue(queueName, {
  connection,
  skipVersionCheck,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

connection.on('error', (error) => {
  console.error(`[queue] Redis error: ${error.message}`);
});

connection.on('connect', () => {
  console.log('[queue] Redis connected');
});

export { connection, jobQueue, queueName };
export { skipVersionCheck };
