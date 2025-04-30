# CodexGuard

A lightweight CLI wrapper around the OpenAI Codex CLI that enforces a configurable daily token cap and gracefully shuts down when the limit is reached.

## Prerequisites

- [Node.js](https://nodejs.org/) v14+
- **An OpenAI API key**.  
  You **must** export it in your ~/.bashrc or as an environment variable before running:

  ```bash
  export OPENAI_API_KEY="your-openai-api-key"
  ```

## Installation

```bash
git clone https://github.com/AssortedFood/codex-guard
cd codex-guard
npm install
```

## Configuration

Create a `config.json` in the project root:

```json
{
  "daily_token_limit": 9900000,
  "warning_threshold_percent": 95,
  "usage_check_interval_seconds": 60,
  "shutdown_timeout_seconds": 60,
  "idle_alert": true
}
```

- **daily_token_limit**  
  The hard cap on total tokens you’re allowed to use per day. Once you exceed this, CodexGuard will mark a pending shutdown.  

- **warning_threshold_percent**  
  The percentage of `daily_token_limit` at which CodexGuard logs a warning (e.g. 95 → warning at 95% of the limit).  

- **usage_check_interval_seconds**  
  How often (in seconds) CodexGuard will automatically poll the Usage API in the background when no “send a message” trigger has appeared. Note that OpenAI enforces a '5 calls per minute' limit on their usage API.

- **shutdown_timeout_seconds**  
  Once the daily cap is reached, the maximum number of seconds to wait for Codex to emit its shutdown prompt (e.g. “send a message” or “Done!”) before forcing a SIGTERM.  

- **idle_alert**  
  `true` to ring the terminal bell (`\a`) each time Codex finishes its response; `false` to remain silent.

## Usage

You can run directly:

```bash
node guard.js --full-auto
```

Or add an alias in your shell:

```bash
alias codex="node /path/to/codex-guard/src/guard.js --full-auto"
```

Then:

```bash
codex
```

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.