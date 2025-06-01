/**
 * Logging Service
 * 
 * Consistent logging setup using Winston with Loki integration
 * (matches the pattern from other coachartie services)
 */

import winston from 'winston';
import LokiTransport from 'winston-loki';

// Create logger configuration
const loggerConfig: winston.LoggerOptions = {
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'coachartie-email',
    version: '1.0.0'
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File transport for production
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
};

// Add Loki transport if configured
if (process.env.LOKI_URL) {
  loggerConfig.transports?.push(
    new LokiTransport({
      host: process.env.LOKI_URL,
      labels: {
        service: 'coachartie-email',
        environment: process.env.NODE_ENV || 'development'
      }
    })
  );
}

export const logger = winston.createLogger(loggerConfig);