import { spawn } from 'node:child_process';
import { freePort } from './free-port.mjs';
import { root, readEnv, webPort } from './read-env.mjs';

const env = readEnv();
const port = webPort(env);

freePort(port);

console.log(`Starting Next.js on http://localhost:${port} ...`);

const child = spawn('npx', ['next', 'dev', '-p', port], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: undefined },
});

child.on('exit', (code) => process.exit(code ?? 0));
