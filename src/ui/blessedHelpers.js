// src/ui/blessedHelpers.js
const blessed = require('blessed');

function createScreen(title = '') {
  const screen = blessed.screen({ smartCSR: true, title });
  screen.key(['q', 'C-c'], () => process.exit(0));
  return screen;
}

function createBox(opts) {
  return blessed.box(Object.assign({
    tags: true,
    border: { type: 'line' }
  }, opts));
}

function createList(opts) {
  return blessed.list(Object.assign({
    keys: true,
    vi: true,
    style: {
      selected: { bg: 'green', fg: 'black' },
      item:        { hover: { bg: 'grey' } },
    }
  }, opts));
}

function createLog(opts) {
  return blessed.log(Object.assign({
    scrollback: 100,
    tags: true
  }, opts));
}

function createProgress(opts) {
  return blessed.progressbar(Object.assign({
    filled: 0,
    style: { bar: { bg: 'cyan' } }
  }, opts));
}

module.exports = { createScreen, createBox, createList, createLog, createProgress };
