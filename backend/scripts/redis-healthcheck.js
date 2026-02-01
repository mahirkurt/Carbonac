import IORedis from "ioredis";

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  console.error("REDIS_URL is not set");
  process.exit(1);
}

const client = new IORedis(redisUrl, {
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
  lazyConnect: true,
});

const key = "carbonac:healthcheck";

async function run() {
  try {
    await client.connect();
    await client.set(key, "ok", "EX", 10);
    const value = await client.get(key);
    await client.quit();
    if (value !== "ok") {
      console.error("Unexpected redis value");
      process.exit(1);
    }
    process.exit(0);
  } catch (error) {
    console.error(error?.message || error);
    try {
      await client.quit();
    } catch {
      // best-effort shutdown
    }
    process.exit(1);
  }
}

run();
