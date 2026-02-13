// Common API types
export interface HealthResponse {
  status: string;
  service: string;
}

export interface ApiError {
  detail: string;
  status_code: number;
}
