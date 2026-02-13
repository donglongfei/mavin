// Agent-related types
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

export interface AgentStatus {
  status: string;
  openclaw_accessible: boolean;
  openclaw_version?: string;
}
