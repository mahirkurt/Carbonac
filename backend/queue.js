import './env.js';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const skipVersionCheck = ['1', 'true', 'yes'].includes(
  (process.env.REDIS_SKIP_VERSION_CHECK || '').toLowerCase()
);
const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
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
  console.error('[queue] Redis connection error:', error.message);
});

export { connection, jobQueue, queueName };
export { skipVersionCheck };
