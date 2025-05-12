#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path          = require('path');
const { Command }   = require('commander');

const GUARD_PATH = path.resolve(__dirname, 'src/guard.js');
const program    = new Command();

program
  .name('guard')
  .description('Codex-Guard CLI: run, init, exec, validate')
  .usage('<command> [options]');

// “run” just proxies to your existing guard.js
program
  .command('run [args...]')
  .description('Spawn codex with token cap and idle alerts (legacy behavior)')
  .allowUnknownOption()            // pass through flags to guard.js
  .action((args = []) => {
    const result = spawnSync(
      'node',
      [GUARD_PATH, '--full-auto', ...args],
      { stdio: 'inherit' }
    );
    process.exit(result.status);
  });

// New sentinel commands
program
  .command('init')
  .description('Initialize a new .guard directory and seed OBJECTIVE.md, plan.json, state.json')
  .action(() => {
    require('./src/commands/init')();
  });

program
  .command('exec')
  .description('Run through your plan.json tasks in autopilot mode')
  .action(() => {
    require('./src/commands/exec')();
  });

program
  .command('validate')
  .description('Validate completed tasks via AI and mark them validated')
  .action(() => {
    require('./src/commands/validate')();
  });

// If no subcommand provided, show help
if (process.argv.length < 3) {
  program.outputHelp();
  process.exit(1);
}

program.parse(process.argv);
