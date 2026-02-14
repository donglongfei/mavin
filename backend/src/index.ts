import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './utils/config.js';
import { logger } from './utils/logger.js';
import chatRouter from './routes/chat.js';
import speechRouter from './routes/speech.js';
import imageRouter from './routes/image.js';
import visionRouter from './routes/vision.js';
import contextRouter from './routes/context.js';
import testRouter from './routes/test.js';
import promptsRouter from './routes/prompts.js';
import aiRouter from './routes/ai.js';
import voiceMusaRouter from './routes/voice-musa.js';
import servicesRouter from './routes/services.js';
import avatarRouter from './routes/avatar.js';
import { serviceManager } from './services/ServiceManager.js';
import { avatarService } from './services/AvatarService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '10mb' }));

// Serve static audio files
const audioDir = path.join(__dirname, '..', 'public', 'audio');
app.use('/audio', express.static(audioDir));

// Serve static avatar files
const avatarUploadsDir = path.join(__dirname, '..', 'storage', 'avatars', 'uploads');
const avatarThumbnailsDir = path.join(__dirname, '..', 'storage', 'avatars', 'thumbnails');
app.use('/avatars/uploads', express.static(avatarUploadsDir));
app.use('/avatars/thumbnails', express.static(avatarThumbnailsDir));

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
app.use('/api/prompts', promptsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/voice', voiceMusaRouter);
app.use('/api/services', servicesRouter);
app.use('/api/avatar', avatarRouter);

/**
 * Initialize and start server
 */
async function startServer() {
  try {
    // Initialize avatar service
    await avatarService.initialize();

    // Initialize all services
    logger.info('='.repeat(60));
    logger.info('Initializing Mavin Voice Backend Services...');
    logger.info('='.repeat(60));

    await serviceManager.initialize();

    const health = serviceManager.getSystemHealth();
    logger.info('');
    logger.info('Service Status Summary:');
    logger.info(`  Total Services: ${health.stats.total}`);
    logger.info(`  ✓ Healthy: ${health.stats.healthy}`);
    logger.info(`  ⚠ Degraded: ${health.stats.degraded}`);
    logger.info(`  ✗ Error: ${health.stats.error}`);
    logger.info(`  - Unavailable: ${health.stats.unavailable}`);
    logger.info(`  Overall: ${health.overall.toUpperCase()}`);
    logger.info('');

    // Display individual service status
    health.services.forEach(service => {
      const statusIcon = {
        healthy: '✓',
        degraded: '⚠',
        error: '✗',
        unavailable: '-',
        starting: '⋯',
      }[service.status];

      logger.info(`  ${statusIcon} ${service.displayName}: ${service.status}`);
      if (service.error) {
        logger.warn(`    Error: ${service.error}`);
      }
    });

    logger.info('');
    logger.info('='.repeat(60));

    // Start Express server
    app.listen(config.port, () => {
      logger.info(`✓ Mavin Backend running on port ${config.port}`);
      logger.info(`  Environment: ${config.nodeEnv}`);
      logger.info(`  CORS origin: ${config.corsOrigin}`);
      logger.info(`  Service API: http://localhost:${config.port}/api/services/health`);
      logger.info('='.repeat(60));
    });

  } catch (error: any) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await serviceManager.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await serviceManager.shutdown();
  process.exit(0);
});

// Start the server
startServer();

export default app;
