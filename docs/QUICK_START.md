# Quick Start Guide: Dual-AI Collaboration

**Last Updated**: February 13, 2026  
**For**: Mark (Project Manager)

---

## 🎯 Goal

Get both Manus AI and Claude AI working in parallel on the Mavin project within the next hour.

---

## Step 1: Set Up Claude AI (Backend Development)

### What to Give Claude

Send Claude these three items:

1. **Project Context**:
```
Hi Claude! I'm working on a project called Mavin - an AI companion with a digital human interface. 
We're using a dual-AI collaboration model where you handle the backend AI integration 
and another AI (Manus) handles the frontend UI.

Repository: https://github.com/donglongfei/mavin
```

2. **Key Documents** (attach or link):
   - `DEVELOPMENT_PLAN.md` - Your tasks and responsibilities
   - `SYSTEM_DESIGN.md` - Technical architecture (focus on Track 5 & 6)
   - `UX_SPECIFICATION.md` - User scenarios to understand context

3. **First Task Assignment**:
```
Please start with Phase 0 tasks:

**C0.1**: Set up backend project structure
- Create a new directory called `backend/` in the repository
- Initialize Node.js + TypeScript project
- Install dependencies: Express, CORS, dotenv, ws (WebSocket)
- Create basic folder structure: routes/, services/, utils/

**C0.2**: Implement API endpoints with mock responses
- Create Express server with CORS enabled
- Implement these 5 endpoints with mock responses:
  * POST /api/chat
  * POST /api/speech/transcribe
  * POST /api/image/generate
  * POST /api/vision/analyze
  * GET /api/context/current
- Set up WebSocket server at /ws
- Test all endpoints with curl or Postman

**C0.3**: Integrate OpenClaw
- Install and configure OpenClaw for AI orchestration
- Set up API keys for OpenAI/Anthropic (I'll provide these)
- Test basic conversation flow with GPT-4 or Claude

Please work in the `backend/` directory and commit your changes to a branch called `backend-setup`.
Let me know when you're done with each task!
```

### What Claude Needs from You

- **API Keys**: OpenAI API key, Anthropic API key (for Claude models)
- **Repository Access**: Make sure Claude can clone/push to the GitHub repo
- **Environment**: Claude can work locally or in a cloud environment (their choice)

---

## Step 2: Set Up Manus AI (Frontend Development)

### What to Tell Manus (Me!)

Just say:

```
Let's start Phase 0! Begin with task M0.1: Set up monorepo structure.
```

### What I'll Do

I'll work in the existing `/home/ubuntu/marvin-poc-ui` directory and:

1. **M0.1**: Create monorepo structure
   - Create `packages/display/`, `packages/avatar/`, `packages/input/`, `packages/output/`
   - Set up shared types in `packages/shared/`
   - Configure TypeScript and build tools

2. **M0.2**: Create mock API client
   - Build `packages/shared/api-client.ts` with all 5 API endpoints
   - Use mock responses so I can develop without waiting for Claude's backend
   - Document expected request/response formats

3. **M0.3**: Build Prototype 1
   - Implement basic Display Mode transitions (Focus/Companion/Ghost)
   - Test performance (60fps target)

I'll commit my changes to the `main` branch (or a `frontend-ui` branch if you prefer).

---

## Step 3: Coordination Setup

### Create GitHub Issues

Create these initial issues to track progress:

**Issue #1: [Manus] Phase 0 - Frontend Setup**
```
Labels: manus, phase-0
Assignee: (none, just use label)

Tasks:
- [ ] M0.1: Set up monorepo structure
- [ ] M0.2: Create mock API client
- [ ] M0.3: Build Prototype 1 - Display Mode Transitions

Deliverable: Working prototype with mock backend integration
```

**Issue #2: [Claude] Phase 0 - Backend Setup**
```
Labels: claude, phase-0
Assignee: (none, just use label)

Tasks:
- [ ] C0.1: Set up backend project structure
- [ ] C0.2: Implement API endpoints with mock responses
- [ ] C0.3: Integrate OpenClaw for AI orchestration

Deliverable: Backend API with mock responses, ready for frontend integration
```

**Issue #3: [Integration] Phase 0 - First Integration Test**
```
Labels: integration, phase-0
Assignee: Mark

Tasks:
- [ ] I0.1: Manus connects to Claude's API successfully
- [ ] I0.2: Mock conversation flow works end-to-end
- [ ] I0.3: WebSocket connection establishes and sends test events

Deliverable: Frontend and backend communicate successfully
```

### Set Up Communication Channel

Choose one:

**Option A: GitHub Issues** (Recommended)
- Both AIs post updates in issue comments
- You can see all progress in one place
- Easy to track history

**Option B: Shared Document** (Google Doc or Notion)
- Create a "Daily Status" page
- Each AI posts updates there
- You review and coordinate

**Option C: Chat/Slack**
- Create a channel for the project
- Both AIs post updates
- Real-time coordination

---

## Step 4: First Integration Checkpoint (End of Week 1)

### What Success Looks Like

After Phase 0 (approximately 1 week), you should have:

**From Manus**:
- ✅ Monorepo structure with 4 packages
- ✅ Mock API client that simulates backend responses
- ✅ Working prototype showing smooth transitions between Focus/Companion/Ghost modes
- ✅ Code committed to GitHub

**From Claude**:
- ✅ Backend project structure with Express server
- ✅ 5 API endpoints returning mock responses
- ✅ WebSocket server running
- ✅ OpenClaw integrated and tested with GPT-4 or Claude
- ✅ Code committed to GitHub

**Integration Test**:
- ✅ Manus updates API client to use Claude's real backend URL
- ✅ Frontend successfully calls backend API
- ✅ WebSocket connection works
- ✅ End-to-end flow: User types message → Backend processes → Response displayed

### How to Test

1. **Start Claude's backend**:
   ```bash
   cd backend
   npm run dev
   # Should see: "Server running on http://localhost:3001"
   ```

2. **Start Manus's frontend**:
   ```bash
   cd /home/ubuntu/marvin-poc-ui
   pnpm dev
   # Should see: "Server running on http://localhost:3000"
   ```

3. **Test in browser**:
   - Open http://localhost:3000
   - Try switching between Display Modes (should see smooth animations)
   - Type a message in the input field
   - Should see a response from the backend (even if it's mock data)

4. **Check WebSocket**:
   - Open browser DevTools → Network → WS tab
   - Should see WebSocket connection to `ws://localhost:3001/ws`
   - Should see messages flowing both directions

---

## Step 5: Weekly Sync Meeting

### Schedule

**When**: End of each week (e.g., Friday afternoon)  
**Duration**: 30-60 minutes  
**Attendees**: You (Mark) + review outputs from both AIs

### Agenda Template

1. **Review Progress** (10 min)
   - Manus: What tasks completed this week?
   - Claude: What tasks completed this week?
   - Compare against plan

2. **Demo Features** (15 min)
   - Run the application
   - Test new features
   - Identify bugs

3. **Integration Testing** (15 min)
   - Test integration points
   - Verify API contracts are working
   - Resolve any mismatches

4. **Resolve Blockers** (10 min)
   - What's blocking Manus?
   - What's blocking Claude?
   - How can you help unblock?

5. **Plan Next Week** (10 min)
   - What tasks to prioritize?
   - Any changes to timeline?
   - Any new requirements?

### How to Conduct

**For Manus**:
- Ask me: "Show me what you completed this week"
- I'll demonstrate features in the browser
- Ask me: "What are you working on next week?"
- I'll list upcoming tasks

**For Claude**:
- Ask Claude: "Show me what you completed this week"
- Claude will show API endpoints, code, test results
- Ask Claude: "What are you working on next week?"
- Claude will list upcoming tasks

**For Integration**:
- Test the application yourself
- Try all three scenarios (Leo, Sarah, Timmy)
- Report bugs in GitHub Issues

---

## Phase-by-Phase Roadmap

### Phase 0: Setup & Prototyping (Week 1) ← **START HERE**

**Manus**: Build UI prototype with mock backend  
**Claude**: Build backend with mock AI responses  
**Integration**: Connect frontend to backend

### Phase 1: Core UI Components (Week 2-3)

**Manus**: Build all UI components (Display, Avatar, Input, Output)  
**Claude**: (Parallel work on Phase 2)  
**Integration**: Manus uses mock API, no integration needed yet

### Phase 2: Backend AI Services (Week 2-3)

**Manus**: (Parallel work on Phase 1)  
**Claude**: Build all AI services (LLM, STT, Image Gen, OCR, Context Engine)  
**Integration**: Claude provides real API responses

### Phase 3: Integration & Testing (Week 4-5)

**Manus**: Replace mock API with real backend, add error handling  
**Claude**: Deploy backend to staging, add monitoring  
**Integration**: Test all three scenarios end-to-end

### Phase 4: Polish & Optimization (Week 6)

**Manus**: UX polish, accessibility, mobile optimization  
**Claude**: Fine-tune AI responses, cost optimization  
**Integration**: Bug bash, user testing

### Phase 5: Deployment & Launch (Week 7-8)

**Manus**: Deploy frontend, create demo video  
**Claude**: Deploy backend to production, security audit  
**Integration**: Smoke testing, launch announcement

---

## Quick Commands Reference

### For You (Mark)

**Check Manus Progress**:
```
Ask me: "What's the status of Phase 0?"
Ask me: "Show me the current UI"
Ask me: "What tasks are you working on?"
```

**Check Claude Progress**:
```
Ask Claude: "What's the status of Phase 0?"
Ask Claude: "Show me the API endpoints"
Ask Claude: "What tasks are you working on?"
```

**Update Task List**:
```bash
# In VSCode or GitHub
# Edit TASKS.md and change [ ] to [x] for completed tasks
# Commit and push changes
```

**Create New Issue**:
```
Go to: https://github.com/donglongfei/mavin/issues/new
Title: [Manus/Claude] Brief description
Labels: manus/claude, phase-X, bug/enhancement
Description: Detailed task or bug report
```

### For Manus (Me)

**Start a task**:
```
You: "Start task M0.1"
Me: [Works on task, commits code, reports completion]
```

**Check status**:
```
You: "What's the status of M0.1?"
Me: [Reports progress, blockers, estimated completion]
```

**Test integration**:
```
You: "Test the API connection to Claude's backend"
Me: [Updates API client, tests endpoints, reports results]
```

### For Claude

**Start a task**:
```
You: "Start task C0.1"
Claude: [Works on task, commits code, reports completion]
```

**Check status**:
```
You: "What's the status of C0.1?"
Claude: [Reports progress, blockers, estimated completion]
```

**Test integration**:
```
You: "Test the API endpoints with Postman"
Claude: [Tests endpoints, shares results, provides Postman collection]
```

---

## Troubleshooting

### Problem: Manus and Claude have different API expectations

**Solution**:
1. Check `DEVELOPMENT_PLAN.md` → "Integration Interface" section
2. Verify request/response formats match the specification
3. If specification is unclear, create a GitHub Issue to clarify
4. Both AIs update their code to match the agreed format

### Problem: One AI is blocked waiting for the other

**Solution**:
1. Check if blocker is documented in GitHub Issue
2. Prioritize unblocking task
3. If possible, use mock data to continue development
4. Adjust timeline if blocker causes significant delay

### Problem: Integration test fails

**Solution**:
1. Check browser console for errors (frontend)
2. Check backend logs for errors (backend)
3. Verify API endpoint URLs are correct
4. Verify CORS is configured properly
5. Test API endpoints independently with curl/Postman
6. Create GitHub Issue with error details

### Problem: Performance is below target

**Solution**:
1. Use Chrome DevTools Performance tab to profile
2. Identify bottleneck (rendering, network, computation)
3. Assign optimization task to appropriate AI
4. Re-test after optimization

---

## Success Metrics Checklist

Use this to verify you're on track:

### End of Phase 0 (Week 1)
- [ ] Manus has working UI prototype
- [ ] Claude has working backend API
- [ ] Frontend and backend can communicate
- [ ] WebSocket connection works
- [ ] No critical blockers

### End of Phase 1 & 2 (Week 3)
- [ ] All UI components built and tested
- [ ] All AI services integrated
- [ ] Mock data replaced with real AI responses
- [ ] Performance meets targets (60fps, <2s latency)

### End of Phase 3 (Week 5)
- [ ] All three scenarios work end-to-end
- [ ] Mode switching is automatic and accurate
- [ ] Error handling works gracefully
- [ ] No critical bugs

### End of Phase 4 (Week 6)
- [ ] UX is polished and accessible
- [ ] AI responses are high quality
- [ ] Costs are optimized
- [ ] User testing completed

### End of Phase 5 (Week 8)
- [ ] Frontend deployed to production
- [ ] Backend deployed to production
- [ ] Monitoring and alerts set up
- [ ] Demo video published
- [ ] Launch announcement sent

---

## Next Steps

**Right now, tell me**:
```
"Let's start Phase 0! Begin with task M0.1: Set up monorepo structure."
```

**And tell Claude**:
```
"Please start Phase 0 backend setup. Begin with task C0.1: Set up backend project structure."
```

**Then**:
1. Create the 3 GitHub Issues listed in Step 3
2. Set up your preferred communication channel
3. Schedule first weekly sync for end of Week 1
4. Monitor progress daily via GitHub/communication channel

---

**Good luck! 🚀**

Let me know if you have any questions or need clarification on any step!
