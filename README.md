# CodexGuard

A lightweight CLI wrapper around the OpenAI Codex CLI that enforces a configurable daily token cap and guides you through multi-stage code generation and validation.

## Prerequisites

* **Node.js** ≥ 16
* **npm**
* An **OpenAI API key** set in your environment as `OPENAI_API_KEY`
* A UNIX-like terminal (macOS, Linux or WSL on Windows)

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/codex-guard.git
   cd codex-guard
   ```

2. **Install dependencies**
   Using npm:

   ```bash
   npm install
   ```

3. **Link the `guard` executable** (optional)

   ```bash
   npm link
   ```

   This will make `guard` available globally.

## Configuration

The primary configuration file is `config.json` in the project root:

```json
{
  "daily_token_limit": 9500000,
  "warning_threshold_percent": 95,
  "usage_check_interval_seconds": 60,
  "shutdown_timeout_seconds": 60,
  "idle_alert": true
}
```

* **daily\_token\_limit**: Maximum tokens allowed per UTC day.
* **warning\_threshold\_percent**: Percentage of cap at which a warning is issued.
* **usage\_check\_interval\_seconds**: How often (in seconds) to poll the OpenAI usage endpoint.
* **shutdown\_timeout\_seconds**: Grace period (in seconds) before force-killing Codex after cap is reached.
* **idle\_alert**: If `true`, emits a bell character when Codex is idle (i.e. waiting for prompts).

## Usage

### Initialise a new project

```bash
guard init
```

This will:

1. Create a hidden `.guard/` folder in your project root.
2. Copy the initial `objective.md` into `.guard/`.
3. Scaffold `plan.json` and `state.json`.
4. Launch an interactive TUI to draft your objective.

### General workflow

Once initialised, simply run:

```bash
guard
```

– without arguments, CodexGuard will detect your current stage (e.g. `draft-usage`, `refine-high`, `exec`, `validate`) and guide you through it.

### Command-line flags

* `-h`, `--help`
  Show usage information.

* `-q`, `--quiet`
  Start in quiet mode (no idle alert).

* `-n`, `--no-warn`
  Disable warnings; only usage stats are shown.

* `-u`, `--usage`
  Shortcut to display current token usage and exit.

* `-p`, `--persistent`
  When cap is reached, wait until UTC 00:00 to auto-restart Codex.

### Stages

1. **draft-objective**
2. **draft-usage**
3. **refine-high**
4. **refine-sub**
5. **score-split**
6. **deps-order**
7. **exec**
8. **validate**
9. **done**

Each stage lives under `src/stages/<stage>.js` and uses corresponding prompt templates in `prompt-templates/`.

## Project Structure

```
.
├── cli.js                # Entry point, dispatches to init or appropriate stage
├── config.json           # User-facing configuration
├── .gitignore
├── LICENSE
├── package.json
├── prompt-templates/     # All Codex prompt templates
├── README.md             # ← you are here
└── src/
    ├── commands/         # CLI sub-commands (init, exec, validate)
    ├── config.js         # Loads and validates config.json
    ├── detectorHandlers.js # Idle-alert & shutdown triggers
    ├── guard.js          # Legacy proxy to Codex for non-initialised projects
    ├── logger.js         # Top-bar and terminal title updates
    ├── notifier.js       # Streams and detects keywords in Codex output
    ├── orchestrator.js   # Loads state and invokes current stage
    ├── shutdown.js       # Manages graceful shutdown on cap breach
    ├── stateManager.js   # Reads/writes `.guard/state.json`
    ├── usage.js          # One-shot usage fetch CLI
    ├── usageManager.js   # Rate-limited periodic usage checks
    └── utils/            # TUI helpers & Codex writer integration
        ├── TUI.js
        └── codexWriter.js
```

## Contributing

1. Fork the repository.
2. Create a feature branch:

   ```bash
   git checkout -b feature/your-idea
   ```
3. Commit your changes and push:

   ```bash
   git commit -m "Add awesome feature"
   git push origin feature/your-idea
   ```
4. Open a pull request.

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.