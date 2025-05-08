import Redis from "ioredis";
import { UPSTASH_REDIS_URL } from "../env";

export const redisClient = new Redis(UPSTASH_REDIS_URL);

// Add Redis client error listeners
redisClient.on("error", (err) => {
  console.error("Redis connection error:", err);
});

redisClient.on("connect", () => {
  console.log("Redis connection established");
});
