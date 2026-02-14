/**
 * Avatar API Client
 * Manages avatar image uploads, gallery, and preferences
 */

const API_BASE = 'http://localhost:8002/api/avatar';

export interface AvatarImage {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  thumbnailUrl: string;
  uploadedAt: string;
  fileSize: number;
  dimensions: {
    width: number;
    height: number;
  };
}

export interface AvatarStateConfig {
  idle: string | null;
  speaking: string | null;
  thinking: string | null;
  listening: string | null;
}

export interface AvatarPreferences {
  userId: string;
  stateConfig: AvatarStateConfig;
  lastUpdated: string;
}

export const avatarApi = {
  /**
   * Upload a new avatar image
   */
  async uploadImage(file: File): Promise<{ success: boolean; image?: AvatarImage; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });

      return await response.json();
    } catch (error) {
      console.error('Failed to upload avatar image:', error);
      return { success: false, error: 'Failed to upload image' };
    }
  },

  /**
   * Get all uploaded avatar images
   */
  async getImages(): Promise<{ success: boolean; images: AvatarImage[]; count: number }> {
    try {
      const response = await fetch(`${API_BASE}/images`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get avatar images:', error);
      return { success: false, images: [], count: 0 };
    }
  },

  /**
   * Delete an avatar image
   */
  async deleteImage(imageId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/images/${imageId}`, {
        method: 'DELETE',
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to delete avatar image:', error);
      return { success: false, error: 'Failed to delete image' };
    }
  },

  /**
   * Get user's avatar preferences
   */
  async getPreferences(userId: string = 'default'): Promise<{ success: boolean; preferences?: AvatarPreferences }> {
    try {
      const response = await fetch(`${API_BASE}/preferences?userId=${userId}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get avatar preferences:', error);
      return { success: false };
    }
  },

  /**
   * Update user's avatar preferences
   */
  async updatePreferences(
    stateConfig: AvatarStateConfig,
    userId: string = 'default'
  ): Promise<{ success: boolean; preferences?: AvatarPreferences; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, stateConfig }),
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to update avatar preferences:', error);
      return { success: false, error: 'Failed to update preferences' };
    }
  },

  /**
   * Get current avatar URLs for all states
   */
  async getCurrentAvatars(userId: string = 'default'): Promise<Record<string, string | null>> {
    try {
      const response = await fetch(`${API_BASE}/current?userId=${userId}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get current avatars:', error);
      return {
        idle: null,
        speaking: null,
        thinking: null,
        listening: null,
      };
    }
  },
};
