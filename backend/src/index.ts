import express from 'express';
import cors from 'cors';
import { config } from './utils/config.js';
import { logger } from './utils/logger.js';
import chatRouter from './routes/chat.js';
import speechRouter from './routes/speech.js';
import imageRouter from './routes/image.js';
import visionRouter from './routes/vision.js';
import contextRouter from './routes/context.js';
import testRouter from './routes/test.js';

const app = express();

// Middleware
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/chat', chatRouter);
app.use('/api/speech', speechRouter);
app.use('/api/image', imageRouter);
app.use('/api/vision', visionRouter);
app.use('/api/context', contextRouter);
app.use('/api/test', testRouter);

// Start server
app.listen(config.port, () => {
  logger.info(`Mavin Backend running on port ${config.port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`CORS origin: ${config.corsOrigin}`);
});

export default app;
