/**
 * Coach Artie Email Interface
 * 
 * This service enables Coach Artie to conduct 1:1 coaching conversations via email,
 * maintaining context across long-running threads just like the Discord interface.
 */

import express from 'express';
import dotenv from 'dotenv';
import { logger } from './services/logger.js';
import { emailWebhookHandler } from './handlers/email-webhook.js';
import { healthCheck } from './handlers/health.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.raw({ type: 'message/rfc822', limit: '10mb' }));

// Routes
app.post('/webhook/email', emailWebhookHandler);
app.get('/health', healthCheck);

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method
  });
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  logger.info('Coach Artie Email Interface started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

export default app;