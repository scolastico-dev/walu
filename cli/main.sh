#!/usr/bin/env node
const { join, resolve } = require('path');
const scriptFile = join(resolve(__dirname), 'main.mjs');
const exec = require('child_process').spawn('node', [
  scriptFile,
  ...process.argv.slice(2),
], { stdio: 'inherit' });
exec.on('exit', function (code) {
  process.exit(code);
});
exec.on('error', function (err) {
  console.error(err);
  process.exit(1);
});
