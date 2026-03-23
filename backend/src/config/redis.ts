import { env } from "./env";

/**
 * Cola (producer): falla pronto si Redis no está — evita que POST /analyze se quede colgado.
 * @see https://docs.bullmq.io/guide/connections
 */
export const redisConnectionForQueue =
  env.REDIS_URL != null && env.REDIS_URL.length > 0
    ? {
        url: env.REDIS_URL,
        connectTimeout: 8_000,
        maxRetriesPerRequest: 2,
        enableOfflineQueue: false,
        retryStrategy: (times: number): number | null => {
          if (times > 4) return null;
          return Math.min(times * 150, 2_000);
        },
      }
    : {
        host: "127.0.0.1",
        port: 6379,
        connectTimeout: 8_000,
        maxRetriesPerRequest: 2,
        enableOfflineQueue: false,
        retryStrategy: (times: number): number | null => {
          if (times > 4) return null;
          return Math.min(times * 150, 2_000);
        },
      };

/**
 * Worker: BullMQ exige maxRetriesPerRequest: null en el consumidor.
 */
export const redisConnectionForWorker =
  env.REDIS_URL != null && env.REDIS_URL.length > 0
    ? {
        url: env.REDIS_URL,
        maxRetriesPerRequest: null,
      }
    : {
        host: "127.0.0.1",
        port: 6379,
        maxRetriesPerRequest: null,
      };
