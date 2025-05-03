# TODO

### notifications
- support mobile push notifications (e.g. Pushover/Pushbullet)

# codex-guard:sentinel

## 1. CLI surface  
- **`guard init`**  
  - Creates a hidden folder (`.guard/`) in the project root  
  - In-terminal TUI to draft **OBJECTIVE.md** and commit to `.guard/OBJECTIVE.md`  
  - TUI to define high‑level tasks in `.guard/plan.json` (only `id` + `description`)  
  - Initialize `.guard/state.json` to `"refine-high"`  
- **`guard exec`**  
  - Autopilot run loop: for each next uncompleted task in `plan.json`  
    - Call AI (4.1‑nano) with `prompts/execute.md`, passing full `OBJECTIVE.md` + single task  
    - Semantic analysis on the AI’s reply:  
      - **Completed & ready** → apply patch, commit (`Complete <id>: <desc>`), mark task `completed:true`  
      - **Stuck / needs help** → notify user and pause until user signals “resolved”  
      - **Error** → notify user and pause until fix  
- **`guard validate`**  
  - For each task with `completed:true` but not yet validated:  
    - Call AI with `prompts/validate.md`, passing `OBJECTIVE.md` + task context + code diff/tests  
    - On success, mark `validated:true`; on failure, notify user and pause  
  - When all tasks validated, print final summary & remind for manual end‑to‑end review  

> **Default `guard` (no args)**  
> If no `.guard/` folder or missing artifacts, just proxy to `codex` with token‑cap & idle alerts.

## 2. Storage & state management  
- All metadata in `.guard/` within user project:  
  - `OBJECTIVE.md` (Markdown)  
  - `plan.json` (structured list of tasks)  
  - `state.json` (tracks current stage: refine‑high → refine‑sub → score‑split → deps‑order → exec → validate → done)  
- Guard drives JSON in place—no more piecemeal field appends by the AI side.

## 3. Prompt templates & loader  
- In **codex-guard** repo, add `prompts/`:  
  - `objective.md`, `refine-high.md`, `refine-sub.md`, `score.md`, `split.md`, `deps.md`, `order.md`, `execute.md`, `validate.md`, `restart.md`  
- Build a prompt manager to pick templates by `state.json.stage`

## 4. Manual refinement TUI  
- Ink+Chalk UI for both high‑level and sub‑task stages:  
  - Render `.guard/plan.json` tasks, allow add/edit/remove  
  - On “Next,” call AI with the correct `refine-*.md` prompt + full `OBJECTIVE.md` + current `plan.json`  
  - Parse structured JSON response back into `plan.json`  
  - Repeat until user confirms completion of each refine stage

## 5. Automated enrichment pipelines  
- **Score & split** (`state: score-split`): one-shot AI calls with `score.md` and `split.md` to append `complexity` and expand high‑complexity tasks  
- **Deps & order** (`state: deps-order`): one-shot AI call with `deps.md` + reordering logic to fill `dependencies` and sort tasks  

## 6. Restart & recovery  
- If `.guard/plan.json` or `state.json` is missing/half‑filled, `guard` auto‑invokes a `restart` handler:  
  - Uses `prompts/restart.md` to rehydrate context or ask user guidance before proceeding  

## 7. Enforcement & schema  
- Define Zod models in `models/` for `plan.json` and `state.json`  
- Enforce consistent commit message style and require tests at `exec` and `validate` stages  

## 8. UX polish & iteration  
- Hot‑reload `plan.json` in the TUI without restarting  
- Y/N loops for automated enrichments (default Y to advance)  
- Easy extension: add new prompt stages by dropping templates into `prompts/` and updating state flow  

### autopilot mode - deprecated since this is folded into sentinel

- add semantic analysis of message before "send a message" to determine if it is appropriate to:
    - prompt cycle (if "I'm done, should i do next step?")
    - alert the user (if "I'm stuck please help")
    - alert the user (if "I'm totally done there are no steps left to do")
- define some character escape sequence to turn this on and off
- store prompt somewhere (potentially in scriptdir/projectdir/both with overrides)
- allow different first prompt

### flags

- remove support for passing codex args
- -q or --quiet // start guard with idle_alert: false regardless of config.json settings
- -h or --help // duh
- -n or --no-warn // start guard in no warn mode, where it will only give usage statistics and never shutdown the codebase or give warnings about token usage
- -u or --usage to call node src/usage.js

### npm package

- pretty simple really, implement this as an npm package