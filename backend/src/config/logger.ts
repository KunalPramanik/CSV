import pino from 'pino';
import { env } from './env.config.js';

const isProduction = env.NODE_ENV === 'production';

export const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : 'info',
  transport: !isProduction
    ? {
        target: 'pino',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'SYS:standard',
        },
      }
    : undefined,
});
