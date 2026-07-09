const { spawn } = require('child_process');
const path = require('path');

const url = 'http://127.0.0.1:5500/index.html';
const serverCommand = process.platform === 'win32' ? 'py' : 'python';
const serverArgs = ['-m', 'http.server', '5500', '--bind', '127.0.0.1'];

console.log('Starte lokalen Server...');
const server = spawn(serverCommand, serverArgs, {
  cwd: process.cwd(),
  stdio: ['ignore', 'pipe', 'pipe']
});

server.on('error', (error) => {
  console.error('Server konnte nicht gestartet werden:', error.message);
  process.exit(1);
});

server.stdout.on('data', (data) => {
  process.stdout.write(data);
});

server.stderr.on('data', (data) => {
  process.stderr.write(data);
});

setTimeout(openBrowser, 500);

function openBrowser() {
  console.log('Öffne Standardbrowser...');
  if (process.platform === 'win32') {
    spawn('cmd', ['/c', 'start', '', url], { shell: true, stdio: 'ignore', detached: true });
  } else if (process.platform === 'darwin') {
    spawn('open', [url], { stdio: 'ignore', detached: true });
  } else {
    spawn('xdg-open', [url], { stdio: 'ignore', detached: true });
  }
}

process.on('SIGINT', () => {
  server.kill();
  process.exit();
});

process.on('SIGTERM', () => {
  server.kill();
  process.exit();
});

// Keep the process alive until the user stops debugging.
process.stdin.resume();
