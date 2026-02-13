// Mavin Backend API Client
// Connects AIBook frontend to Mavin v1.0 backend

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface AgentRequest {
  prompt: string;
  context?: Record<string, any>;
}

export interface AgentResponse {
  response: string;
  metadata: {
    agent_type: string;
    processing_time: number;
    session_id: string;
    return_code: number;
  };
}

export interface MemoryItem {
  content: string;
  metadata?: Record<string, any>;
}

export interface MemorySearchResult {
  content: string;
  score: number;
  metadata: Record<string, any>;
}

class MavinAPI {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  // Agent Operations
  async executeAgent(prompt: string, context: Record<string, any> = {}): Promise<AgentResponse> {
    const response = await fetch(`${this.baseURL}/api/agent/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, context }),
    });

    if (!response.ok) {
      throw new Error(`Agent execution failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getAgentStatus() {
    const response = await fetch(`${this.baseURL}/api/agent/status`);

    if (!response.ok) {
      throw new Error(`Failed to get agent status: ${response.statusText}`);
    }

    return response.json();
  }

  // Memory Operations
  async storeMemory(content: string, metadata: Record<string, any> = {}) {
    const response = await fetch(`${this.baseURL}/api/memory/store`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, metadata }),
    });

    if (!response.ok) {
      throw new Error(`Memory storage failed: ${response.statusText}`);
    }

    return response.json();
  }

  async searchMemory(query: string, limit: number = 5): Promise<MemorySearchResult[]> {
    const response = await fetch(`${this.baseURL}/api/memory/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, limit }),
    });

    if (!response.ok) {
      throw new Error(`Memory search failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getMemoryStats() {
    const response = await fetch(`${this.baseURL}/api/memory/stats`);

    if (!response.ok) {
      throw new Error(`Failed to get memory stats: ${response.statusText}`);
    }

    return response.json();
  }

  // Health & Status
  async healthCheck() {
    const response = await fetch(`${this.baseURL}/api/health`);

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }

    return response.json();
  }

  async readinessCheck() {
    const response = await fetch(`${this.baseURL}/api/ready`);

    if (!response.ok) {
      throw new Error(`Readiness check failed: ${response.statusText}`);
    }

    return response.json();
  }
}

// Export singleton instance
export const mavinAPI = new MavinAPI();

// Export class for custom instances
export default MavinAPI;
