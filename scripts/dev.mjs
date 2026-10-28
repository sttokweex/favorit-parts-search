import { spawn } from 'node:child_process';

const children = [
  spawn(process.execPath, ['server/index.js'], { stdio: 'inherit' }),
  spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['exec', 'vite', '--', '--host', '127.0.0.1'], { stdio: 'inherit' }),
];

function stop() {
  for (const child of children) child.kill();
}

process.on('SIGINT', stop);
process.on('SIGTERM', stop);
for (const child of children) child.on('exit', stop);
