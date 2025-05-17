# TODO

# codex-guard:sentinel

## 1. CLI surface
- **`guard init`**
  - ~~Creates a hidden folder (`.guard/`) in the project root  ~~
  - ~~Initialize `.guard/state.json` to `"draft-objective"`~~
  - ~~TUI to draft **objective.md** and commit to `.guard/objective.md`~~
  - TUI to draft **usage.md** and commit to `.guard/usage.md`
  - TUI to define high‑level tasks in `.guard/plan.json` (only `id` + `description`)
  - TUI to define low‑level tasks in `.guard/plan.json` (only `id` + `description`)
  - TUI to define task scores in `.guard/plan.json` (only `id` + `description`)
  - TUI to define task dependencies in `.guard/plan.json` (only `id` + `description`)
- **phase: exec**
  - Autopilot run loop: for each next uncompleted task in `plan.json`
    - Call AI (4.1‑nano) with `prompts/execute.md`, passing full `objective.md` + single task
    - Semantic analysis on the AI’s reply:  
      - **Completed & ready** → apply patch, commit (`Complete <id>: <desc>`), mark task`completed:true`
      - **Stuck / needs help** → notify user and pause until user signals “resolved”
      - **Error** → notify user and pause until fix
- **phase:  validate**
  - For each task with `completed:true` but not yet validated:
    - Call AI with `prompts/validate.md`, passing `objective.md` + task context + code diff/tests
    - On success, mark `validated:true`; on failure, notify user and pause
  - When all tasks validated, print final summary & remind for manual end‑to‑end review

> **Default `guard` (no args)**
> ~~If no `.guard/` folder or missing artifacts, just proxy to `codex` with token‑cap & idle alerts.~~

## 2. Storage & state management
- ~~All metadata in `.guard/` within user project:~~
  - ~~`objective.md` (Markdown)~~
  - ~~`usage.md` (Markdown)~~
  - ~~`plan.json` (structured list of tasks)~~
  - ~~`state.json` (tracks current stage: draft-objective → draft-usage → refine‑high → refine‑sub → score‑split → deps‑order → exec → validate → done)~~

## 3. Prompt templates & loader
- In **codex-guard** repo, add `prompt-templates/`:
  - `objective.md`,`usage.md`, `refine-high.md`, `refine-sub.md`, `score.md`, `split.md`, `deps.md`, `order.md`, `execute.md`, `validate.md`, `restart.md`

## 4. Manual refinement TUI
- Chalk UI for all init stages:
  - Render `.guard/plan.json` tasks
  - Parse structured JSON response back into `plan.json`
  - Repeat until user confirms completion of each refine stage

## 5. Automated enrichment pipelines
- **Score & split** (`state: score-split`): one-shot AI calls with `score.md` and `split.md` to append `complexity` and expand high‑complexity tasks
- **Deps & order** (`state: deps-order`): one-shot AI call with `deps.md` + reordering logic to fill `dependencies` and sort tasks

## 9. UX polish & iteration
- Hot‑reload `plan.json` in the TUI without restarting
- Easy extension: create a utility to add new prompt stages (automating updates to stateManager, prompt-templates/, etc)

### flags

- ~~remove support for passing codex args~~
- -q or --quiet // start guard with idle_alert: false regardless of config.json settings
- -h or --help
- -n or --no-warn // start guard in no warn mode, where it will only give usage statistics and never shutdown the codebase or give warnings about token usage
- -u or --usage // to call node src/usage.js
- -p or --persistent // when guard reaches the token limit and kills codex, it waits until UTC 00:00 where it calls usage to confirm that the token limit has reset and then restarts codex from the last stage


### general

- implement this as an npm package
- support mobile push notifications (e.g. Pushover/Pushbullet)
- push notification confirming auto-restart on UTC 00:00
- refactor to ES modules
- add ESLint