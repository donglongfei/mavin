/**
 * Avatar Image Type Definitions
 */

export interface AvatarImage {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  thumbnailUrl: string;
  uploadedAt: Date;
  fileSize: number;
  dimensions: {
    width: number;
    height: number;
  };
}

export interface AvatarStateConfig {
  idle: string | null; // Image ID for idle state
  speaking: string | null; // Image ID for speaking state
  thinking: string | null; // Image ID for thinking state
  listening: string | null; // Image ID for listening state
}

export interface UserAvatarPreferences {
  userId: string; // For future multi-user support (default: "default")
  stateConfig: AvatarStateConfig;
  lastUpdated: Date;
}

export interface AvatarImageDatabase {
  images: Record<string, AvatarImage>;
}

export interface AvatarPreferencesDatabase {
  preferences: Record<string, UserAvatarPreferences>;
}
