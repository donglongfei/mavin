# CLAUDE.md — 通用规范 + 重构指南

直接复制保存到项目根目录：

```markdown
# CLAUDE.md

> Claude Code MUST read and follow ALL rules in this file.
> This file governs both daily development and refactoring tasks.

---

## ⚙️ HOW TO WORK

### Thinking Process

Before ANY code change, think through these steps:

1. **READ** — Understand the current code structure first
2. **PLAN** — Explain what you will do and which files are affected
3. **CONFIRM** — Wait for approval on large changes (5+ files)
4. **EXECUTE** — Make the change
5. **VERIFY** — Run build, confirm nothing breaks

### Communication Style

- When asked to review: give a structured report, don't change code
- When asked to refactor: change structure only, never change behavior
- When asked to add features: follow existing patterns, don't reinvent
- When unsure: STOP and ask, don't guess
- Always tell me what you changed and why in a short summary

---

## 🚫 NEVER

- Never use `any` type — use `unknown` + type guards or proper types
- Never leave `console.log` — use a logger utility or remove it
- Never hardcode values — extract to constants or env vars
- Never put business logic in route handlers or page files
- Never create a file over 150 lines
- Never create a function over 30 lines
- Never create a component over 100 lines
- Never skip error handling on async operations
- Never modify multiple concerns in one commit
- Never import from a higher layer into a lower layer
- Never duplicate logic that exists elsewhere — reuse it
- Never commit secrets, .env files, or API keys
- Never change functionality during a refactor

---

## ✅ ALWAYS

- Always add explicit return types to functions
- Always add JSDoc comments to exported functions
- Always validate inputs at API/service boundaries
- Always handle error, loading, and empty states in UI
- Always check for existing utilities before writing new ones
- Always follow existing patterns in the codebase
- Always run build after changes to confirm zero errors
- Always put types in a dedicated types folder, not inline
- Always use consistent naming (see Naming section)
- Always keep one responsibility per file

---

## 📁 FILE STRUCTURE

```
/app (or /pages)     → Routes only. Thin wrappers. Max 40 lines.
/components          → UI rendering only. No data fetching. No logic.
  /components/ui     → Base UI library (shadcn etc). DO NOT MODIFY.
  /components/[domain] → Domain-grouped components (posts/, auth/, etc.)
  /components/shared → Reusable across domains (Spinner, EmptyState)
/services            → ALL business logic. One service per domain.
/lib                 → Pure utilities. Zero side effects.
/types               → Type definitions only. No runtime code.
/hooks               → Client-side state & data fetching.
/constants           → App-wide constants & configuration.
```

### Dependency Direction (one way only, top to bottom)

```
app/routes
    ↓
components → hooks
    ↓          ↓
services     lib
    ↓
lib + types
```

If A imports B, then B must NEVER import A.

---

## 📏 SIZE LIMITS

| Scope | Max | Action |
|---|---|---|
| File | 150 lines | Split by responsibility |
| Function | 30 lines | Extract helper functions |
| Component | 100 lines | Extract sub-components |
| Route handler | 40 lines | Delegate to service |
| Parameters | 3 params | Use an options object instead |

---

## ✏️ NAMING

| Thing | Convention | Example |
|---|---|---|
| Files & folders | kebab-case | `user-profile.tsx` |
| Components | PascalCase | `UserProfile` |
| Functions & vars | camelCase | `getUserById` |
| Constants | UPPER_SNAKE | `MAX_RETRY` |
| Types | PascalCase | `UserProfile` |
| Enums | PascalCase | `Status` |
| Enum values | UPPER_SNAKE | `Status.NOT_FOUND` |
| Env vars | UPPER_SNAKE | `DATABASE_URL` |
| Booleans | is/has/can/should prefix | `isLoading`, `hasAccess` |
| Event handlers | handle + Event | `handleClick`, `handleSubmit` |
| Test files | `.test.ts` suffix | `scoring.test.ts` |

---

## 🛡️ ERROR HANDLING

All service functions return:

```typescript
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string }
```

```typescript
// ✅ Correct
async function getUser(id: string): Promise<Result<User>> {
  try {
    const user = await db.user.findUnique({ where: { id } })
    if (!user) return { success: false, error: 'User not found' }
    return { success: true, data: user }
  } catch (err) {
    logger.error('getUser failed', err)
    return { success: false, error: 'Internal error' }
  }
}

// ❌ Wrong
async function getUser(id: string) {
  return await db.user.findUnique({ where: { id } })
}
```

---

## 📝 DOCUMENTATION

```typescript
/**
 * Short description of what this does.
 *
 * @param input - Description of parameter
 * @returns Description of return value
 */
export function doSomething(input: Input): Output {
  // ...
}
```

- Every exported function: full JSDoc
- Internal helpers: at least a one-line comment
- Complex logic: explain WHY, not WHAT

---

## 🧩 ADDING NEW FEATURES

Order of implementation:

1. **Types first** → `/types/`
2. **Service logic** → `/services/`
3. **API routes** → `/app/api/` (thin wrapper calling service)
4. **UI components** → `/components/`
5. **Hook up data** → `/hooks/` or server actions

Before writing anything, check: does something similar already exist?

---

## ✅ COMPLETION CHECKLIST

Before marking any task done:

- [ ] No file over 150 lines
- [ ] No function over 30 lines
- [ ] No `any` types
- [ ] No hardcoded magic values
- [ ] No console.log (only logger)
- [ ] No unused imports or variables
- [ ] No commented-out code
- [ ] No duplicated logic
- [ ] All exports have JSDoc
- [ ] Error states handled
- [ ] Build passes with zero errors

---

# ======================================================
# 🔧 REFACTORING PLAYBOOK
# ======================================================
#
# Use this section when refactoring an existing project.
# Run each phase as a SEPARATE conversation/task.
# Git commit after each phase.
#
# ======================================================

## REFACTOR PHASE 0: AUDIT

```
Analyze the entire codebase and produce a refactoring report.
DO NOT change any code.

Report the following:

### 1. File Size Violations
List every file over 150 lines. Show filename and line count.
Sort by line count descending.

### 2. Large Functions
List every function over 30 lines. Show file, function name, line count.

### 3. Type Safety Issues
Count all uses of `any`, `as any`, `@ts-ignore`, `@ts-expect-error`.
List the worst offending files.

### 4. Dead Code
- Unused imports
- Unused exported functions (exported but never imported elsewhere)
- Commented-out code blocks
- Unreachable code

### 5. Duplication
Find logic that appears 3+ times across different files.
Describe the pattern and list where it occurs.

### 6. Architecture Violations
- Business logic in route handlers or components
- Components doing data fetching directly
- Circular dependencies
- Files that don't fit the folder structure convention

### 7. Inconsistencies
- Mixed naming conventions
- Multiple error handling patterns
- Inconsistent return types across services

### 8. Hardcoded Values
Magic numbers, hardcoded URLs, inline config values.

### 9. Missing Error Handling
Async calls without try/catch or .catch().
Functions that can throw but callers don't handle it.

### 10. Overall Health Score
Rate 1-10 and list the top 5 priorities to fix first.

Output as a structured markdown document.
Save as REFACTOR-REPORT.md in the project root.
```

---

## REFACTOR PHASE 1: SET UP STRUCTURE

```
Based on the REFACTOR-REPORT.md, restructure the project folders
to match the file structure convention in this CLAUDE.md.

Steps:
1. Create any missing folders
2. Move files to their correct locations
3. Update all import paths
4. DO NOT rename or rewrite any functions yet
5. Run build to confirm nothing breaks

Commit message: "refactor: reorganize file structure"
```

---

## REFACTOR PHASE 2: EXTRACT TYPES

```
Find all inline type definitions, interfaces defined inside
component or service files, and repeated type shapes.

Steps:
1. Create organized files in /types/ folder
2. Move all type definitions there
3. Group by domain (user.ts, post.ts, api.ts, etc.)
4. Update all imports
5. Replace any `any` with proper types where straightforward
6. Run build to confirm nothing breaks

Commit message: "refactor: extract and centralize types"
```

---

## REFACTOR PHASE 3: EXTRACT CONSTANTS

```
Find all hardcoded values: magic numbers, string literals,
URLs, config values, repeated inline objects.

Steps:
1. Create /constants/ folder (or /lib/constants.ts)
2. Extract all values with descriptive names
3. Group by domain
4. Replace all occurrences with the constant reference
5. Run build to confirm nothing breaks

Commit message: "refactor: extract constants and config values"
```

---

## REFACTOR PHASE 4: EXTRACT UTILITIES

```
Find duplicated logic (identified in REFACTOR-REPORT.md Phase 0).

Steps:
1. For each duplicated pattern, create a utility function in /lib/
2. Give it a clear name and JSDoc
3. Refactor all occurrences to use the shared utility
4. Run build to confirm nothing breaks

Commit message: "refactor: extract shared utilities"
```

---

## REFACTOR PHASE 5: SPLIT LARGE FILES

```
Take the list of files over 150 lines from the audit.
Start with the LARGEST file first.

For each large file:
1. Identify the distinct responsibilities in the file
2. Split into separate files, one responsibility each
3. Create an index.ts that re-exports the public API
4. External consumers should not need to change their imports
5. Run build after EACH file split

Do ONE file at a time. Confirm build passes between each.

Commit message: "refactor: split [filename] into smaller modules"
```

---

## REFACTOR PHASE 6: STANDARDIZE ERROR HANDLING

```
Audit all service functions for inconsistent error handling.

Steps:
1. Create Result<T> type in /types/api.ts (if not exists)
2. Create a logger utility in /lib/logger.ts (if not exists)
3. Refactor each service function to:
   - Return Result<T>
   - Wrap async code in try/catch
   - Log errors through logger
   - Never throw — always return error result
4. Update all callers to handle the Result type
5. Run build to confirm nothing breaks

Commit message: "refactor: standardize error handling"
```

---

## REFACTOR PHASE 7: ENFORCE ARCHITECTURE LAYERS

```
Move misplaced logic to the correct layer:

1. Find business logic in route handlers → move to /services/
2. Find data fetching in components → move to /hooks/ or server actions
3. Find UI logic in services → move to /components/
4. Make route handlers thin: parse request → call service → return response
5. Run build to confirm nothing breaks

Commit message: "refactor: enforce layer separation"
```

---

## REFACTOR PHASE 8: CLEAN UP

```
Final cleanup pass:

1. Remove all unused imports
2. Remove all unused functions and variables
3. Remove all commented-out code blocks
4. Replace all console.log with logger calls (or remove)
5. Remove all @ts-ignore and @ts-expect-error (fix the actual type issue)
6. Add JSDoc to any exported function missing it
7. Ensure consistent naming throughout
8. Run build to confirm nothing breaks

Commit message: "refactor: final cleanup"
```

---

## REFACTOR PHASE 9: VERIFY

```
Final verification:

1. Run the full build
2. Run the full audit again (same as Phase 0)
3. Compare the new audit against the original REFACTOR-REPORT.md
4. List remaining issues (if any) as REFACTOR-TODO.md
5. Give a final health score

Save as REFACTOR-COMPLETE.md in the project root.
```

---

# ======================================================
# 💡 QUICK REFERENCE — COPY-PASTE PROMPTS
# ======================================================

## When project feels messy, run:
# "Follow CLAUDE.md Phase 0 — audit the project and create REFACTOR-REPORT.md"

## When a single file is too big:
# "This file is over 150 lines. Split it by responsibility per CLAUDE.md rules."

## When adding a feature and want it clean:
# "Add [feature]. Follow CLAUDE.md rules. Check the completion checklist."

## Periodic health check (run every few days):
# "Run the Phase 0 audit. Compare to previous report. Are things getting better or worse?"

## When code smells but you're not sure what's wrong:
# "Review this file against CLAUDE.md rules. List every violation. Don't fix yet."
```

---

## 使用步骤

```bash
# 1. 放到项目根目录
cp CLAUDE.md /path/to/your/project/

# 2. 开始重构 — 告诉 Claude Code：
"Follow CLAUDE.md Phase 0 — audit the project and create REFACTOR-REPORT.md"

# 3. 看完报告后，逐步执行：
"Follow CLAUDE.md Phase 1 — restructure folders"
"Follow CLAUDE.md Phase 2 — extract types"
"Follow CLAUDE.md Phase 3 — extract constants"
# ... 一直到 Phase 9

# 4. 每个 Phase 之间 git commit
git add -A && git commit -m "refactor: phase X complete"
```

**核心原则：一次只做一件事，做完就 commit，出问题就 rollback。** 🎯