# Antigravity Orchestration Config

## 🤖 Pipeline Core Routing
- **Base Engine**: Antigravity 2.0 Harness
- **Context Fallback**: Default to strict sequential execution.

---

## 👥 Sub-Agents & LLM Mapping

### 1. PM / Orchestrator
- **Model**: google/gemini-3.1-pro
- **Goal**: Interpret user instruction, trigger step-by-step pipeline, and output final status.
- **Tools**: CLI Execution, File Read.

### 2. Product Planner & Researcher
- **Model**: google/gemini-3.5-flash
- **Goal**: Inspect errors in files, search the web for solutions, and compile the final blueprint into `brief.md`.
- **Tools**: Google Search, Web Browser, File Read.

### 3. Developer
- **Model**: anthropic/claude-opus
- **Goal**: Write and modify application code (Next.js, Firebase) strictly based on `brief.md`.
- **Tools**: File Write, Code Editor.

### 4. QA / Tester / Self-Healer
- **Model**: google/gemini-3.1-pro
- **Goal**: Establish testing rules, execute build command (`npm run build`), parse logs, and loop back to Developer on compile errors.
- **Tools**: CLI Command, Sandbox Terminal.

### 5. Git & Release Operator
- **Model**: google/gemini-3.5-flash
- **Goal**: Push clean builds to GitHub with structured commits (e.g., `feat:`, `fix:`) to trigger Vercel deployment.
- **Tools**: Git CLI.

### 6. Growth Marketer
- **Model**: google/gemini-3.5-flash
- **Goal**: Draft engaging release notes and marketing copy based on the code changes.
- **Tools**: Text Generator.

---

## 🔄 Strict Workflow Order
1. **Instruction Received** -> Trigger Orchestrator.
2. **Analysis** -> Planner writes `brief.md` utilizing Search.
3. **Coding** -> Developer edits source files.
4. **Validation** -> Tester runs build.
   - *If Failure*: Pipe logs back to Developer, repeat Step 3.
   - *If Success*: Proceed to Step 5.
5. **Deployment** -> Git Operator commits and pushes.
6. **Delivery** -> Marketer generates release content, Orchestrator reports back to Telegram.
