// Memory-related types
export interface MemoryItem {
  content: string;
  metadata?: Record<string, any>;
}

export interface MemorySearchResult {
  content: string;
  score: number;
  metadata?: Record<string, any>;
}

export interface MemoryStats {
  collection: string;
  points_count: number;
  status: string;
}

export interface MemorySearchRequest {
  query: string;
  limit?: number;
}
