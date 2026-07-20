// Launches `ng serve` via the local Angular CLI using node directly, so it
// works even when `yarn`/`ng` are not on PATH. Runs from this file's directory
// so the CLI finds angular.json regardless of the spawn cwd.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const ng = join(here, 'node_modules', '@angular', 'cli', 'bin', 'ng.js');

const child = spawn(
  process.execPath,
  [ng, 'serve', '--port', '4200', '--host', 'localhost'],
  { cwd: here, stdio: 'inherit' },
);

child.on('exit', (code) => process.exit(code ?? 0));
