# TODO

### autopilot mode

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
- -a or --autopilot // start guard in autopilot mode
- -h or --help // duh
- -n or --no-warn // start guard in no warn mode, where it will only give usage statistics and never shutdown the codebase or give warnings about token usage
