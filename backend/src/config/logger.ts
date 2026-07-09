import pino from 'pino';
import { env } from './env.config.js';

export const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : 'info',
});
