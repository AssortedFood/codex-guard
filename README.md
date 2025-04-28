# CodexGuard

A lightweight CLI wrapper around the OpenAI Codex CLI that enforces a configurable daily token cap and gracefully shuts down when the limit is reached.

## Prerequisites

- [Node.js](https://nodejs.org/) v14+
- **An OpenAI API key**.  
  You **must** export it as an environment variable before running:

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
  "warning_threshold_percent": 95
}
```

- **daily_token_limit**: Maximum tokens you want to allow per day.  
- **warning_threshold_percent**: Percent of the cap at which to issue a warning.

## Usage

You can run directly:

```bash
node guard.js --full-auto
```

Or add an alias in your shell:

```bash
alias codex="node /path/to/codex-guard/guard.js --full-auto"
```

Then:

```bash
codex
```

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.