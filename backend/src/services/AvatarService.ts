import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { nanoid } from 'nanoid';
import { logger } from '../utils/logger.js';
import type {
  AvatarImage,
  AvatarStateConfig,
  UserAvatarPreferences,
  AvatarImageDatabase,
  AvatarPreferencesDatabase,
} from '../types/avatar.js';

/**
 * Avatar Service - Manages avatar image uploads, thumbnails, and user preferences
 */
export class AvatarService {
  private storageDir: string;
  private uploadsDir: string;
  private thumbnailsDir: string;
  private imagesDbPath: string;
  private preferencesDbPath: string;

  constructor() {
    this.storageDir = path.join(process.cwd(), 'storage', 'avatars');
    this.uploadsDir = path.join(this.storageDir, 'uploads');
    this.thumbnailsDir = path.join(this.storageDir, 'thumbnails');
    this.imagesDbPath = path.join(this.storageDir, 'images.json');
    this.preferencesDbPath = path.join(this.storageDir, 'preferences.json');
  }

  /**
   * Initialize storage and database files
   */
  async initialize(): Promise<void> {
    try {
      // Ensure directories exist
      await fs.mkdir(this.uploadsDir, { recursive: true });
      await fs.mkdir(this.thumbnailsDir, { recursive: true });

      // Initialize image database if it doesn't exist
      try {
        await fs.access(this.imagesDbPath);
      } catch {
        await fs.writeFile(
          this.imagesDbPath,
          JSON.stringify({ images: {} }, null, 2)
        );
      }

      // Initialize preferences database if it doesn't exist
      try {
        await fs.access(this.preferencesDbPath);
      } catch {
        await fs.writeFile(
          this.preferencesDbPath,
          JSON.stringify({ preferences: {} }, null, 2)
        );
      }

      logger.info('Avatar service initialized');
    } catch (error) {
      logger.error('Failed to initialize avatar service:', error);
      throw error;
    }
  }

  /**
   * Upload avatar image, create thumbnail, and save metadata
   */
  async uploadImage(
    file: Express.Multer.File
  ): Promise<AvatarImage> {
    try {
      const imageId = nanoid();
      const ext = path.extname(file.originalname).toLowerCase();
      const timestamp = Date.now();
      const filename = `avatar_${timestamp}_${imageId}${ext}`;
      const thumbnailFilename = `avatar_${timestamp}_${imageId}.jpg`; // Always JPEG for thumbnails

      const uploadPath = path.join(this.uploadsDir, filename);
      const thumbnailPath = path.join(this.thumbnailsDir, thumbnailFilename);

      logger.info(`Processing avatar upload: ${file.originalname} -> ${filename}`);

      // Get image metadata
      const metadata = await sharp(file.path).metadata();
      logger.info(`Image dimensions: ${metadata.width}x${metadata.height}`);

      // Move uploaded file to storage
      await fs.rename(file.path, uploadPath);
      logger.info(`Image moved to: ${uploadPath}`);

      // Generate thumbnail (200x200, cover fit)
      await sharp(uploadPath)
        .resize(200, 200, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);
      logger.info(`Thumbnail generated: ${thumbnailPath}`);

      // Create image metadata
      const avatarImage: AvatarImage = {
        id: imageId,
        filename,
        originalName: file.originalname,
        url: `/avatars/uploads/${filename}`,
        thumbnailUrl: `/avatars/thumbnails/${thumbnailFilename}`,
        uploadedAt: new Date(),
        fileSize: file.size,
        dimensions: {
          width: metadata.width || 0,
          height: metadata.height || 0,
        },
      };

      // Save to database
      await this.saveImageToDb(avatarImage);

      logger.info(`Avatar image uploaded successfully: ${imageId} (${file.originalname})`);
      return avatarImage;
    } catch (error) {
      logger.error('Failed to upload avatar image:', error);
      // Clean up temporary file if it exists
      try {
        await fs.unlink(file.path);
      } catch {}
      throw error;
    }
  }

  /**
   * List all uploaded avatar images
   */
  async listImages(): Promise<AvatarImage[]> {
    try {
      const db = await this.loadImagesDb();
      return Object.values(db.images);
    } catch (error) {
      logger.error('Failed to list avatar images:', error);
      return [];
    }
  }

  /**
   * Get specific avatar image by ID
   */
  async getImage(imageId: string): Promise<AvatarImage | null> {
    try {
      const db = await this.loadImagesDb();
      return db.images[imageId] || null;
    } catch (error) {
      logger.error(`Failed to get avatar image ${imageId}:`, error);
      return null;
    }
  }

  /**
   * Delete avatar image and thumbnail
   */
  async deleteImage(imageId: string): Promise<boolean> {
    try {
      const db = await this.loadImagesDb();
      const image = db.images[imageId];

      if (!image) {
        logger.warn(`Avatar image not found: ${imageId}`);
        return false;
      }

      // Delete files
      const uploadPath = path.join(this.uploadsDir, image.filename);
      const thumbnailPath = path.join(this.thumbnailsDir, image.filename);

      await fs.unlink(uploadPath).catch(() => {});
      await fs.unlink(thumbnailPath).catch(() => {});

      // Remove from database
      delete db.images[imageId];
      await this.saveImagesDb(db);

      // Remove from user preferences if used
      await this.removeImageFromPreferences(imageId);

      logger.info(`Avatar image deleted: ${imageId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete avatar image ${imageId}:`, error);
      return false;
    }
  }

  /**
   * Get user's avatar preferences
   */
  async getUserPreferences(
    userId: string = 'default'
  ): Promise<UserAvatarPreferences> {
    try {
      const db = await this.loadPreferencesDb();
      return (
        db.preferences[userId] || {
          userId,
          stateConfig: {
            idle: null,
            speaking: null,
            thinking: null,
            listening: null,
          },
          lastUpdated: new Date(),
        }
      );
    } catch (error) {
      logger.error(`Failed to get user preferences for ${userId}:`, error);
      return {
        userId,
        stateConfig: {
          idle: null,
          speaking: null,
          thinking: null,
          listening: null,
        },
        lastUpdated: new Date(),
      };
    }
  }

  /**
   * Update user's avatar preferences
   */
  async updateUserPreferences(
    userId: string = 'default',
    stateConfig: AvatarStateConfig
  ): Promise<UserAvatarPreferences> {
    try {
      const db = await this.loadPreferencesDb();

      const preferences: UserAvatarPreferences = {
        userId,
        stateConfig,
        lastUpdated: new Date(),
      };

      db.preferences[userId] = preferences;
      await this.savePreferencesDb(db);

      logger.info(`Avatar preferences updated for ${userId}`);
      return preferences;
    } catch (error) {
      logger.error(
        `Failed to update user preferences for ${userId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get current avatar URLs for all states
   */
  async getCurrentAvatarUrls(
    userId: string = 'default',
    baseUrl: string = 'http://localhost:8002'
  ): Promise<Record<string, string | null>> {
    try {
      const preferences = await this.getUserPreferences(userId);
      const db = await this.loadImagesDb();

      const result: Record<string, string | null> = {
        idle: null,
        speaking: null,
        thinking: null,
        listening: null,
      };

      for (const [state, imageId] of Object.entries(preferences.stateConfig)) {
        if (imageId && db.images[imageId]) {
          result[state] = `${baseUrl}${db.images[imageId].url}`;
        }
      }

      return result;
    } catch (error) {
      logger.error('Failed to get current avatar URLs:', error);
      return {
        idle: null,
        speaking: null,
        thinking: null,
        listening: null,
      };
    }
  }

  /**
   * Get image URL by ID
   */
  async getImageUrl(imageId: string, baseUrl: string = 'http://localhost:8002'): Promise<string | null> {
    const image = await this.getImage(imageId);
    return image ? `${baseUrl}${image.url}` : null;
  }

  // Private helper methods

  private async loadImagesDb(): Promise<AvatarImageDatabase> {
    const data = await fs.readFile(this.imagesDbPath, 'utf-8');
    const db = JSON.parse(data);
    // Convert date strings back to Date objects
    for (const image of Object.values(db.images) as AvatarImage[]) {
      image.uploadedAt = new Date(image.uploadedAt);
    }
    return db;
  }

  private async saveImagesDb(db: AvatarImageDatabase): Promise<void> {
    await fs.writeFile(this.imagesDbPath, JSON.stringify(db, null, 2));
  }

  private async saveImageToDb(image: AvatarImage): Promise<void> {
    const db = await this.loadImagesDb();
    db.images[image.id] = image;
    await this.saveImagesDb(db);
  }

  private async loadPreferencesDb(): Promise<AvatarPreferencesDatabase> {
    const data = await fs.readFile(this.preferencesDbPath, 'utf-8');
    const db = JSON.parse(data);
    // Convert date strings back to Date objects
    for (const prefs of Object.values(db.preferences) as UserAvatarPreferences[]) {
      prefs.lastUpdated = new Date(prefs.lastUpdated);
    }
    return db;
  }

  private async savePreferencesDb(
    db: AvatarPreferencesDatabase
  ): Promise<void> {
    await fs.writeFile(this.preferencesDbPath, JSON.stringify(db, null, 2));
  }

  private async removeImageFromPreferences(imageId: string): Promise<void> {
    const db = await this.loadPreferencesDb();
    let updated = false;

    for (const prefs of Object.values(db.preferences)) {
      for (const [state, id] of Object.entries(prefs.stateConfig)) {
        if (id === imageId) {
          prefs.stateConfig[state as keyof AvatarStateConfig] = null;
          updated = true;
        }
      }
    }

    if (updated) {
      await this.savePreferencesDb(db);
      logger.info(`Removed image ${imageId} from user preferences`);
    }
  }
}

// Singleton instance
export const avatarService = new AvatarService();
