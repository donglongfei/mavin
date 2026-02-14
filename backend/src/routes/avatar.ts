import { Router } from 'express';
import multer from 'multer';
import { avatarService } from '../services/AvatarService.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Configure multer for avatar uploads
const upload = multer({
  dest: '/tmp/avatar-uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, and WEBP are allowed.'));
    }
  },
});

/**
 * POST /api/avatar/upload
 * Upload new avatar image
 */
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided',
      });
    }

    logger.info(`Avatar upload request: ${req.file.originalname} (${req.file.size} bytes)`);

    const image = await avatarService.uploadImage(req.file);

    res.json({
      success: true,
      image: {
        id: image.id,
        filename: image.filename,
        url: image.url,
        thumbnailUrl: image.thumbnailUrl,
        dimensions: image.dimensions,
        fileSize: image.fileSize,
      },
    });
  } catch (error: any) {
    logger.error('Avatar upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload avatar image',
    });
  }
});

/**
 * GET /api/avatar/images
 * List all uploaded avatar images
 */
router.get('/images', async (req, res) => {
  try {
    const images = await avatarService.listImages();

    res.json({
      success: true,
      images: images.map((img) => ({
        id: img.id,
        filename: img.filename,
        originalName: img.originalName,
        url: img.url,
        thumbnailUrl: img.thumbnailUrl,
        uploadedAt: img.uploadedAt,
        fileSize: img.fileSize,
        dimensions: img.dimensions,
      })),
      count: images.length,
    });
  } catch (error: any) {
    logger.error('Failed to list avatar images:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list avatar images',
    });
  }
});

/**
 * GET /api/avatar/images/:id
 * Get specific avatar image details
 */
router.get('/images/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const image = await avatarService.getImage(id);

    if (!image) {
      return res.status(404).json({
        success: false,
        error: 'Avatar image not found',
      });
    }

    res.json({
      success: true,
      image: {
        id: image.id,
        filename: image.filename,
        originalName: image.originalName,
        url: image.url,
        thumbnailUrl: image.thumbnailUrl,
        uploadedAt: image.uploadedAt,
        fileSize: image.fileSize,
        dimensions: image.dimensions,
      },
    });
  } catch (error: any) {
    logger.error(`Failed to get avatar image ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get avatar image',
    });
  }
});

/**
 * DELETE /api/avatar/images/:id
 * Delete avatar image
 */
router.delete('/images/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await avatarService.deleteImage(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Avatar image not found',
      });
    }

    res.json({
      success: true,
      message: 'Avatar image deleted successfully',
    });
  } catch (error: any) {
    logger.error(`Failed to delete avatar image ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete avatar image',
    });
  }
});

/**
 * GET /api/avatar/preferences
 * Get user's avatar state configuration
 */
router.get('/preferences', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || 'default';
    const preferences = await avatarService.getUserPreferences(userId);

    res.json({
      success: true,
      preferences: {
        userId: preferences.userId,
        stateConfig: preferences.stateConfig,
        lastUpdated: preferences.lastUpdated,
      },
    });
  } catch (error: any) {
    logger.error('Failed to get avatar preferences:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get avatar preferences',
    });
  }
});

/**
 * PUT /api/avatar/preferences
 * Update user's avatar state configuration
 */
router.put('/preferences', async (req, res) => {
  try {
    const userId = (req.body.userId as string) || 'default';
    const { stateConfig } = req.body;

    if (!stateConfig) {
      return res.status(400).json({
        success: false,
        error: 'stateConfig is required',
      });
    }

    // Validate state config has all required states
    const requiredStates = ['idle', 'speaking', 'thinking', 'listening'];
    for (const state of requiredStates) {
      if (!(state in stateConfig)) {
        return res.status(400).json({
          success: false,
          error: `Missing required state: ${state}`,
        });
      }
    }

    const preferences = await avatarService.updateUserPreferences(
      userId,
      stateConfig
    );

    res.json({
      success: true,
      preferences: {
        userId: preferences.userId,
        stateConfig: preferences.stateConfig,
        lastUpdated: preferences.lastUpdated,
      },
    });
  } catch (error: any) {
    logger.error('Failed to update avatar preferences:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update avatar preferences',
    });
  }
});

/**
 * GET /api/avatar/current
 * Get current avatar URLs for all states
 */
router.get('/current', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || 'default';
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const avatarUrls = await avatarService.getCurrentAvatarUrls(userId, baseUrl);

    res.json(avatarUrls);
  } catch (error: any) {
    logger.error('Failed to get current avatar URLs:', error);
    res.status(500).json({
      idle: null,
      speaking: null,
      thinking: null,
      listening: null,
    });
  }
});

export default router;
