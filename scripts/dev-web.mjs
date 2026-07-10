import { spawn } from 'node:child_process';
import { freePort } from './free-port.mjs';
import { root, readEnv, webPort } from './read-env.mjs';

const env = readEnv();
const nextPort = webPort(env);

freePort(nextPort);

console.log('');
console.log('DiFarm — single Next.js process (UI + API on the same port)');
console.log(`  Open: http://localhost:${nextPort}`);
console.log(`  API:  http://localhost:${nextPort}/api/v1`);
console.log('');

const child = spawn('npx', ['next', 'dev', '-p', nextPort], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: undefined },
});

child.on('exit', (code) => process.exit(code ?? 0));
