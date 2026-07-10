import { spawn } from 'node:child_process';
import { freePort } from './free-port.mjs';
import { root, readEnv, webPort } from './read-env.mjs';

const env = readEnv();
const apiPort = env.PORT ?? '4000';
const nextPort = webPort(env);

freePort(apiPort);
freePort(nextPort);

console.log('');
console.log('DiFarm dev — everything runs from difarm-next');
console.log(`  App:  http://localhost:${nextPort}  ← open this in your browser`);
console.log(`  API:  http://localhost:${apiPort}  (started automatically)`);
console.log('');

const child = spawn(
  'npx',
  [
    'concurrently',
    '-n',
    'api,web',
    '-c',
    'blue,green',
    '"npm run dev:api"',
    '"npm run dev:web"',
  ],
  {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  },
);

child.on('exit', (code) => process.exit(code ?? 0));
