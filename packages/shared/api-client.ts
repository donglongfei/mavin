/**
 * API Client for Mavin Backend
 * 
 * This client provides methods to communicate with the backend API.
 * In development mode (useMock = true), it returns mock responses.
 * In production mode, it makes real HTTP requests to the backend.
 */

import {
  ChatRequest,
  ChatResponse,
  TranscriptionRequest,
  TranscriptionResponse,
  ImageGenerationRequest,
  ImageGenerationResponse,
  VisionAnalysisRequest,
  VisionAnalysisResponse,
  ContextResponse,
  WebSocketEvent,
  WebSocketEventType,
} from './types';
import { generateId, sleep } from './utils';

export class ApiClient {
  private baseUrl: string;
  private useMock: boolean;
  private ws: WebSocket | null = null;
  private wsEventHandlers: Map<WebSocketEventType, Set<(payload: any) => void>> = new Map();

  constructor(baseUrl: string = 'http://localhost:8002/api', useMock: boolean = false) {
    this.baseUrl = baseUrl;
    this.useMock = useMock;
  }

  /**
   * Enable or disable mock mode
   */
  setMockMode(enabled: boolean) {
    this.useMock = enabled;
  }

  /**
   * POST /api/chat/chat
   * Send a chat message and receive AI response
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    if (this.useMock) {
      return this.mockChat(request);
    }

    const response = await fetch(`${this.baseUrl}/chat/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Chat API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * POST /api/speech/transcribe
   * Transcribe audio to text
   */
  async transcribe(request: TranscriptionRequest): Promise<TranscriptionResponse> {
    if (this.useMock) {
      return this.mockTranscribe(request);
    }

    const formData = new FormData();
    formData.append('audio', request.audio);
    formData.append('language', request.language);
    formData.append('mode', request.mode);

    const response = await fetch(`${this.baseUrl}/speech/transcribe`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Transcription API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * POST /api/image/generate
   * Generate images from text prompt
   */
  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    if (this.useMock) {
      return this.mockGenerateImage(request);
    }

    const response = await fetch(`${this.baseUrl}/image/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Image generation API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * POST /api/vision/analyze
   * Analyze image (OCR, object detection, scene understanding)
   */
  async analyzeVision(request: VisionAnalysisRequest): Promise<VisionAnalysisResponse> {
    if (this.useMock) {
      return this.mockAnalyzeVision(request);
    }

    const formData = new FormData();
    formData.append('image', request.image);
    formData.append('features', JSON.stringify(request.features));

    const response = await fetch(`${this.baseUrl}/vision/analyze`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Vision analysis API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * GET /api/context/current
   * Get current context and mode suggestions
   */
  async getContext(userId: string): Promise<ContextResponse> {
    if (this.useMock) {
      return this.mockGetContext(userId);
    }

    const response = await fetch(`${this.baseUrl}/context/current?userId=${userId}`);

    if (!response.ok) {
      throw new Error(`Context API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * POST /api/context/event
   * Send context event to backend
   */
  async sendContextEvent(userId: string, eventType: string, payload: any): Promise<void> {
    if (this.useMock) {
      // Mock: just log the event
      console.log('[Mock] Context event:', { userId, eventType, payload });
      return;
    }

    const response = await fetch(`${this.baseUrl}/context/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, eventType, payload }),
    });

    if (!response.ok) {
      throw new Error(`Context event API error: ${response.statusText}`);
    }
  }

  // ============================================================================
  // WebSocket Methods
  // ============================================================================

  /**
   * Connect to WebSocket server
   */
  connectWebSocket(userId: string): void {
    if (this.ws) {
      console.warn('WebSocket already connected');
      return;
    }

    const wsUrl = this.baseUrl.replace('http', 'ws').replace('/api', `/ws?userId=${userId}`);
    
    if (this.useMock) {
      console.log('[Mock] WebSocket connection simulated');
      this.simulateMockWebSocketEvents();
      return;
    }

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const wsEvent: WebSocketEvent = JSON.parse(event.data);
        this.handleWebSocketEvent(wsEvent);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.ws = null;
    };
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnectWebSocket(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Subscribe to WebSocket events
   */
  onWebSocketEvent(eventType: WebSocketEventType, handler: (payload: any) => void): () => void {
    if (!this.wsEventHandlers.has(eventType)) {
      this.wsEventHandlers.set(eventType, new Set());
    }
    this.wsEventHandlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.wsEventHandlers.get(eventType)?.delete(handler);
    };
  }

  /**
   * Send event to WebSocket server
   */
  sendWebSocketEvent(eventType: WebSocketEventType, payload: any): void {
    if (this.useMock) {
      console.log('[Mock] WebSocket send:', { eventType, payload });
      return;
    }

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    this.ws.send(JSON.stringify({ type: eventType, payload }));
  }

  private handleWebSocketEvent(event: WebSocketEvent): void {
    const handlers = this.wsEventHandlers.get(event.type);
    if (handlers) {
      handlers.forEach(handler => handler(event.payload));
    }
  }

  // ============================================================================
  // Mock Response Methods
  // ============================================================================

  private async mockChat(request: ChatRequest): Promise<ChatResponse> {
    await sleep(800); // Simulate network delay

    const responses = [
      "I understand. Let me help you with that.",
      "That's a great question! Here's what I think...",
      "Based on what you've told me, I suggest...",
      "Let me break this down for you.",
      "I can help you with that. First, let's...",
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    return {
      messageId: generateId('msg'),
      response: randomResponse + ` (Mock response to: "${request.message}")`,
      suggestedMode: Math.random() > 0.7 ? 'focus' : null,
      actions: [],
    };
  }

  private async mockTranscribe(request: TranscriptionRequest): Promise<TranscriptionResponse> {
    await sleep(1200); // Simulate transcription delay

    return {
      transcriptionId: generateId('trans'),
      text: 'This is a mock transcription of your audio.',
      confidence: 0.92,
      language: request.language,
    };
  }

  private async mockGenerateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    await sleep(3000); // Simulate image generation delay

    const mockImages = Array.from({ length: request.count }, (_, i) => ({
      id: generateId('img'),
      url: `https://picsum.photos/seed/${Date.now()}-${i}/1024/1024`,
      thumbnail: `https://picsum.photos/seed/${Date.now()}-${i}/256/256`,
    }));

    return {
      requestId: generateId('req'),
      images: mockImages,
    };
  }

  private async mockAnalyzeVision(request: VisionAnalysisRequest): Promise<VisionAnalysisResponse> {
    await sleep(1500); // Simulate vision analysis delay

    const hasOCR = request.features.includes('ocr');
    const hasObjects = request.features.includes('objects');
    const hasScene = request.features.includes('scene');

    return {
      analysisId: generateId('vision'),
      text: hasOCR ? 'Mock OCR text: This is sample text extracted from the image.' : null,
      objects: hasObjects
        ? [
            { name: 'person', confidence: 0.95 },
            { name: 'book', confidence: 0.87 },
            { name: 'desk', confidence: 0.76 },
          ]
        : [],
      sceneDescription: hasScene
        ? 'A person studying at a desk with books and papers.'
        : null,
    };
  }

  private async mockGetContext(userId: string): Promise<ContextResponse> {
    await sleep(300); // Simulate context fetch delay

    return {
      suggestedMode: 'focus',
      suggestedInteraction: 'conversational',
      currentEvent: null,
      environment: {
        noiseLevel: 'quiet',
        outputPreference: 'voice',
      },
    };
  }

  private simulateMockWebSocketEvents(): void {
    // Simulate mode suggestion after 5 seconds
    setTimeout(() => {
      this.handleWebSocketEvent({
        type: 'mode.suggested',
        payload: {
          mode: 'companion',
          reason: 'Calendar event: Physics 101 starting in 5 minutes',
        },
      });
    }, 5000);

    // Simulate proactive message after 10 seconds
    setTimeout(() => {
      this.handleWebSocketEvent({
        type: 'message.proactive',
        payload: {
            message: 'Hey! I noticed you have been working for a while. Want to take a break?',
          priority: 'medium',
        },
      });
    }, 10000);
  }
}

// Export singleton instance - connected to backend on port 8002
export const apiClient = new ApiClient('http://localhost:8002/api', false);
