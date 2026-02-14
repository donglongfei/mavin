# Skills & Processes - Mavin Project

## Abstract: Reusable Project Patterns

This document contains abstract, reusable processes learned from building Mavin that can be applied to other projects.

---

## 1. Frontend-Backend Integration Pattern

### Process: Connect React Frontend to Node.js Backend

**When to use:** Any project with separate frontend/backend requiring API communication

**Steps:**

1. **Define API Contract First**
   ```typescript
   // Create shared types
   interface ChatRequest { message: string; conversationId?: string }
   interface ChatResponse { response: string; conversationId: string }
   ```

2. **Create Singleton API Client**
   ```typescript
   // packages/shared/api-client.ts
   export class ApiClient {
     constructor(baseUrl: string, useMock: boolean) {...}
     async chat(request: ChatRequest): Promise<ChatResponse> {...}
   }
   export const apiClient = new ApiClient('http://localhost:PORT/api', false);
   ```

3. **Backend Route Implementation**
   ```typescript
   // backend/src/routes/MODULE.ts
   router.post('/ENDPOINT', async (req, res) => {
     const { param1, param2 } = req.body;
     // Process request
     res.json({ result });
   });
   ```

4. **Frontend Usage**
   ```typescript
   // In React component
   const response = await apiClient.METHOD(params);
   setData(response);
   ```

**Key Principle:** Single source of truth for API contracts via shared types

---

## 2. External CLI Integration Pattern

### Process: Wrap CLI Tools in Service Layer

**When to use:** Integrating external CLI tools (OpenClaw, ffmpeg, imagemagick, etc.)

**Steps:**

1. **Create Service Wrapper**
   ```typescript
   export class CLIService {
     async execute(command: string, sessionId?: string) {
       const { stdout } = await execAsync(`cli-tool ${command}`);
       return this.parseOutput(stdout);
     }
   }
   ```

2. **Handle Output Parsing**
   ```typescript
   private parseOutput(stdout: string) {
     // Extract JSON from mixed output
     const jsonMatch = stdout.match(/\{[\s\S]*\}/);
     return JSON.parse(jsonMatch[0]);
   }
   ```

3. **Manage Session/Context**
   ```typescript
   private conversationHistory: Map<string, Message[]> = new Map();
   ```

4. **Add Error Handling**
   ```typescript
   try {
     const result = await this.execute(cmd);
   } catch (error) {
     logger.error('CLI execution failed:', error);
     throw new Error('Service unavailable');
   }
   ```

**Key Principle:** Isolate CLI complexity behind clean service interface

---

## 3. CORS Configuration Pattern

### Process: Set Up CORS for Local Development

**When to use:** Frontend and backend on different ports/origins

**Steps:**

1. **Create Config File**
   ```typescript
   // backend/src/utils/config.ts
   export const config = {
     corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
   };
   ```

2. **Create .env File**
   ```bash
   # backend/.env
   CORS_ORIGIN=http://localhost:FRONTEND_PORT
   ```

3. **Apply in Express**
   ```typescript
   import cors from 'cors';
   app.use(cors({ origin: config.corsOrigin }));
   ```

4. **Verify CORS Headers**
   ```bash
   curl -v http://localhost:API_PORT/endpoint \
     -H "Origin: http://localhost:FRONTEND_PORT" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS
   ```

**Key Principle:** Environment variables > hardcoded values for flexibility

---

## 4. Unit Testing for API Integration

### Process: Create Comprehensive Test Suite

**When to use:** Testing any API integration or service

**Test Structure:**

1. **Health Check Test**
   - Verify service is running
   - Check basic connectivity

2. **Simple Request Test**
   - Test basic functionality
   - Verify request/response format

3. **State Persistence Test**
   - Test session/context continuity
   - Verify data is maintained across requests

4. **Feature-Specific Tests**
   - Test special features (persona, options, etc.)
   - Verify edge cases

5. **Error Handling Test**
   - Test validation (empty input, wrong format)
   - Verify proper error responses

**Implementation:**
```javascript
async function runAllTests() {
  const results = [
    await testHealthCheck(),
    await testSimpleRequest(),
    await testStatePersistence(),
    await testFeatures(),
    await testErrorHandling()
  ];

  const passed = results.filter(r => r).length;
  console.log(`${passed}/${results.length} tests passed`);
}
```

**Key Principle:** Test pyramid - many simple tests, few complex integration tests

---

## 5. Monorepo Package Management

### Process: Organize Code in Monorepo

**When to use:** Projects with shared code between frontend/backend

**Structure:**
```
project/
├── apps/
│   └── web/              # Frontend app
├── backend/              # Backend API
├── packages/
│   ├── shared/          # Shared types & utilities
│   ├── types/           # TypeScript definitions
│   └── [feature]/       # Feature packages
└── pnpm-workspace.yaml
```

**Setup:**

1. **Create workspace config**
   ```yaml
   # pnpm-workspace.yaml
   packages:
     - 'apps/*'
     - 'packages/*'
   ```

2. **Add package.json to each package**
   ```json
   {
     "name": "@project/package-name",
     "dependencies": {
       "@project/shared": "workspace:*"
     }
   }
   ```

3. **Install dependencies**
   ```bash
   pnpm install
   ```

**Key Principle:** Workspace protocol enables local package linking

---

## 6. Process Management Pattern

### Process: Handle Multiple Development Servers

**When to use:** Projects with multiple services (frontend, backend, db)

**Best Practices:**

1. **Check for running processes before starting**
   ```bash
   lsof -ti:PORT | xargs kill -9 2>/dev/null
   pnpm dev
   ```

2. **Use different ports for each service**
   ```
   Frontend:  3000-3999
   Backend:   8000-8999
   Database:  5432, 6379, etc.
   ```

3. **Background task management**
   ```bash
   # Start in background
   pnpm dev > /tmp/service.log 2>&1 &

   # Check logs
   tail -f /tmp/service.log
   ```

4. **Cleanup script**
   ```bash
   #!/bin/bash
   pkill -f "pnpm.*dev"
   pkill -f "tsx"
   echo "All dev processes stopped"
   ```

**Key Principle:** One port per service, always check before starting

---

## 7. Error Debugging Pattern

### Process: Debug Frontend-Backend Integration Issues

**When to use:** "It doesn't work" - unknown failure

**Debugging Steps:**

1. **Check Services Are Running**
   ```bash
   curl http://localhost:BACKEND_PORT/health
   curl http://localhost:FRONTEND_PORT
   ```

2. **Test API Directly**
   ```bash
   curl -X POST http://localhost:API_PORT/endpoint \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   ```

3. **Check CORS**
   ```bash
   curl -v http://localhost:API_PORT/endpoint \
     -H "Origin: http://localhost:FRONTEND_PORT" \
     -X OPTIONS
   ```

4. **Add Console Logging**
   ```typescript
   console.log('Request:', request);
   console.log('Response:', response);
   console.error('Error:', error);
   ```

5. **Browser DevTools**
   - Network tab: See actual requests
   - Console: See errors
   - Application tab: Check localStorage

**Key Principle:** Isolate the problem - test each layer independently

---

## 8. Configuration Management Pattern

### Process: Manage Environment-Specific Settings

**When to use:** Different settings for dev/staging/production

**Structure:**

1. **Config file with defaults**
   ```typescript
   // src/utils/config.ts
   export const config = {
     port: process.env.PORT || 3000,
     apiUrl: process.env.API_URL || 'http://localhost:8000',
   };
   ```

2. **.env file (not in git)**
   ```bash
   PORT=8002
   API_URL=http://localhost:8002
   CORS_ORIGIN=http://localhost:3003
   ```

3. **.env.example (in git)**
   ```bash
   PORT=8002
   API_URL=http://localhost:8000
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Load environment**
   ```typescript
   import dotenv from 'dotenv';
   dotenv.config();
   ```

**Priority:** .env file > config defaults

**Key Principle:** .env overrides code - check .env when config doesn't match expectations

---

## 9. UI Integration Pattern

### Process: Connect UI Components to Backend

**When to use:** React components need backend data

**Pattern:**

1. **Create State**
   ```typescript
   const [data, setData] = useState<Type[]>([]);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   ```

2. **API Call in Handler**
   ```typescript
   const handleAction = async () => {
     setLoading(true);
     try {
       const response = await apiClient.method(params);
       setData(response.data);
     } catch (error) {
       setError(error.message);
       console.error('Action failed:', error);
     } finally {
       setLoading(false);
     }
   };
   ```

3. **Show Loading/Error States**
   ```typescript
   {loading && <Spinner />}
   {error && <ErrorMessage>{error}</ErrorMessage>}
   {data && <DataDisplay data={data} />}
   ```

**Key Principle:** Always handle loading, success, and error states

---

## 10. Development Workflow Pattern

### Process: Iterate on Features Efficiently

**Steps:**

1. **Backend First**
   - Implement API endpoint
   - Test with curl/Postman
   - Write unit tests

2. **Frontend Integration**
   - Update API client types
   - Implement UI component
   - Connect to API

3. **Test Integration**
   - Manual testing in browser
   - Check Network tab
   - Verify error handling

4. **Iterate**
   - Fix bugs
   - Add error messages
   - Improve UX

**Key Principle:** Build bottom-up, test each layer before moving up

---

## 11. Resizable Panel Layout Pattern

### Process: Create Responsive, Resizable UI Layouts

**When to use:** Multi-pane applications where users need to adjust panel sizes

**Steps:**

1. **Install resizable panel library**
   ```bash
   pnpm add react-resizable-panels
   ```

2. **Create resizable layout**
   ```typescript
   import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

   <ResizablePanelGroup direction="horizontal">
     <ResizablePanel defaultSize={15} minSize={12} maxSize={25}>
       {leftContent}
     </ResizablePanel>

     <ResizableHandle className="w-1 hover:bg-accent transition-colors" />

     <ResizablePanel defaultSize={50} minSize={30}>
       {middleContent}
     </ResizablePanel>

     <ResizableHandle />

     <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
       {rightContent}
     </ResizablePanel>
   </ResizablePanelGroup>
   ```

3. **Set size constraints**
   - `defaultSize`: Initial panel size (percentage)
   - `minSize`: Minimum size to prevent too small panels
   - `maxSize`: Maximum size to prevent full-screen takeover

4. **Style resize handles**
   ```css
   .resize-handle {
     background: rgba(0, 0, 0, 0.1);
     transition: all 0.2s ease;
   }
   .resize-handle:hover {
     background: var(--accent-color);
     box-shadow: 0 0 10px var(--glow-color);
   }
   ```

**Key Principle:** User control + sensible constraints = better UX

---

## 12. Custom Scrollbar Styling Pattern

### Process: Create Elegant, Themed Scrollbars

**When to use:** Custom-designed applications with specific color themes

**Implementation:**

```css
/* Webkit browsers (Chrome, Safari, Edge) */
*::-webkit-scrollbar {
  width: 6px;  /* Slim scrollbar */
  height: 6px;
}

*::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);  /* Subtle track */
  border-radius: 3px;
}

*::-webkit-scrollbar-thumb {
  background: linear-gradient(
    180deg,
    var(--color-1) 0%,
    var(--color-2) 100%
  );
  border-radius: 3px;
  transition: all 0.2s ease;
}

*::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(
    180deg,
    var(--color-1-bright) 0%,
    var(--color-2-bright) 100%
  );
  box-shadow: 0 0 8px var(--glow-color);
}

/* Firefox */
* {
  scrollbar-width: thin;
  scrollbar-color: var(--thumb-color) var(--track-color);
}
```

**Design Tips:**
- Keep width slim (6-8px) for elegance
- Use transparent/subtle track colors
- Add gradient to thumb for visual interest
- Include hover state with glow effect
- Match app's color theme
- Ensure cross-browser compatibility

**Key Principle:** Slim + themed + interactive = elegant scrollbars

---

## 13. Local Voice Service Integration Pattern

### Process: Add TTS and ASR with GPU Support

**When to use:** Applications requiring local voice capabilities (privacy, offline, low latency)

**Architecture:**

```
User Audio → ASR (Whisper) → GPU/CPU → Text
                                          ↓
                                    AI Processing
                                          ↓
AI Text → TTS (Piper) → CPU → Audio → User
```

**Implementation Steps:**

1. **Python Service Layer**
   ```python
   # local_asr.py - ASR using faster-whisper
   def transcribe_audio(audio_path, model_size='base'):
       model = WhisperModel(model_size, device='auto')
       segments, info = model.transcribe(audio_path)
       return {'text': text, 'language': info.language}

   # local_tts.py - TTS using piper
   def synthesize_speech(text, voice='en_US-lessac-medium'):
       voice_model = PiperVoice.load(model_file)
       voice_model.synthesize(text, output_file)
       return {'audio_path': output_file}
   ```

2. **Node.js Wrapper Services**
   ```typescript
   export class LocalASRService {
     async transcribe(audioPath: string): Promise<ASRResult> {
       const cmd = `python3 local_asr.py "${audioPath}"`;
       const { stdout } = await execAsync(cmd);
       return JSON.parse(stdout);
     }
   }

   export class LocalTTSService {
     async synthesize(text: string): Promise<TTSResult> {
       const cmd = `python3 local_tts.py "${text}"`;
       const { stdout } = await execAsync(cmd);
       return JSON.parse(stdout);
     }
   }
   ```

3. **Unified Voice Service**
   ```typescript
   export class LocalVoiceService {
     async conversationTurn(audioPath, chatFn): Promise<Result> {
       const userText = await asr.transcribe(audioPath);
       const aiText = await chatFn(userText);
       const aiAudio = await tts.synthesize(aiText);
       return { userText, aiText, aiAudio };
     }
   }
   ```

4. **API Routes with File Upload**
   ```typescript
   router.post('/voice/conversation', upload.single('audio'), async (req, res) => {
     const result = await localVoice.conversationTurn(
       req.file.path,
       (text) => aiService.chat(text)
     );
     res.json(result);
   });
   ```

**GPU Support Strategy:**

1. Auto-detect available device: MUSA → CUDA → CPU
2. Graceful fallback to CPU if GPU unavailable
3. Log device being used for transparency

```python
def check_device():
    if has_musa(): return 'musa'
    if has_cuda(): return 'cuda'
    return 'cpu'
```

**Dependencies:**
- Python: `faster-whisper`, `piper-tts`
- Node: `multer` (file upload)
- Optional: `torch-musa` (MUSA GPU), `torch` (CUDA)

**Model Management:**
- Models auto-download on first use
- Store in `~/.cache/whisper/` and `~/.local/share/piper/`
- Size: 145MB-3GB depending on quality

**Performance Tips:**
- ASR: Use `base` model for CPU, `small`+ for GPU
- TTS: Very fast on CPU (~0.3s per sentence)
- Cache transcriptions for repeated audio
- Clean up old audio files regularly

**Key Principle:** Local processing = privacy + speed, with GPU acceleration when available

---

## Summary Checklist

When starting a new full-stack project:

- [ ] Define API contracts (TypeScript interfaces)
- [ ] Set up monorepo structure (if needed)
- [ ] Configure CORS properly (.env file)
- [ ] Create API client singleton
- [ ] Implement backend routes with error handling
- [ ] Add logging (console.log for dev, logger for prod)
- [ ] Write unit tests for API
- [ ] Create UI components with loading/error states
- [ ] Test with curl before connecting frontend
- [ ] Check for port conflicts before starting
- [ ] Use hard refresh when testing frontend changes
- [ ] Document configuration in .env.example
- [ ] Implement resizable panels for better UX (if multi-pane)
- [ ] Style scrollbars to match theme (slim, elegant)

---

## Reusable Code Templates

### API Client Template
```typescript
export class ApiClient {
  constructor(private baseUrl: string, private useMock: boolean) {}

  async request<T>(endpoint: string, options: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, options);
    if (!response.ok) throw new Error(response.statusText);
    return response.json();
  }
}
```

### Service Wrapper Template
```typescript
export class ExternalService {
  async execute(params: Params): Promise<Result> {
    try {
      const output = await execAsync(`command ${params}`);
      return this.parseOutput(output);
    } catch (error) {
      logger.error('Service failed:', error);
      throw error;
    }
  }
}
```

### Test Suite Template
```javascript
async function runTests() {
  const tests = [
    { name: 'Health', fn: testHealth },
    { name: 'Basic', fn: testBasic },
    { name: 'Error', fn: testError }
  ];

  for (const test of tests) {
    const result = await test.fn();
    console.log(`${result ? '✓' : '✗'} ${test.name}`);
  }
}
```

---

*Last Updated: 2026-02-13*
*Project: Mavin - Full-Stack AI Integration*
