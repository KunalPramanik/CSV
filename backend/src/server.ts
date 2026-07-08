import app from './app.js';
import { env } from './config/env.config.js';
import { logger } from './config/logger.js';

const server = app.listen(env.PORT, () => {
  logger.info(`Server is running in ${env.NODE_ENV} mode on port ${env.PORT}`);
});

// Handle graceful shutdowns
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed. Exiting process.');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Force closing connections. Exiting process.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ promise, reason }, 'Unhandled Promise Rejection detected');
});
process.on('uncaughtException', (error) => {
  logger.error(error, 'Uncaught Exception thrown');
  process.exit(1);
});
