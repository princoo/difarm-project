import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { freePort } from './free-port.mjs';
import { readEnv } from './read-env.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const apiDir = path.join(root, 'backend');

if (!fs.existsSync(apiDir)) {
  console.error(`API folder not found: ${apiDir}`);
  console.error('Run: npm run setup');
  process.exit(1);
}

const env = readEnv();
const frontendUrl = env.FRONTEND_URL ?? env.FRONTEND_UrL ?? 'http://localhost:3003';

const apiEnv = [
  `PORT=${env.PORT ?? '4000'}`,
  `DATABASE_URL=${env.DATABASE_URL ?? ''}`,
  `FRONTEND_UrL=${frontendUrl}`,
  `JWT_SECRET=${env.JWT_SECRET ?? ''}`,
  `EXPIRE_TIME=${env.EXPIRE_TIME ?? '7d'}`,
  `JWT_VERIF_SECRET=${env.JWT_VERIF_SECRET ?? ''}`,
  `EXPIRE_VERIF_TIME=${env.EXPIRE_VERIF_TIME ?? '24h'}`,
  `EMAIL_USERNAME=${env.EMAIL_USERNAME ?? ''}`,
  `EMAIL_PASS=${env.EMAIL_PASS ?? ''}`,
  `EMAIL=${env.EMAIL ?? ''}`,
].join('\n');

fs.writeFileSync(path.join(apiDir, '.env'), `${apiEnv}\n`, 'utf8');

const apiPort = env.PORT ?? '4000';
freePort(apiPort);

const nodeModules = path.join(apiDir, 'node_modules');
if (!fs.existsSync(nodeModules)) {
  console.log('Installing API dependencies (first time only)…');
  const install = spawn('npm', ['install'], {
    cwd: apiDir,
    stdio: 'inherit',
    shell: true,
  });
  install.on('exit', (code) => {
    if (code !== 0) process.exit(code ?? 1);
    startApi();
  });
} else {
  startApi();
}

function startApi() {
  freePort(apiPort);
  console.log(`Starting API on http://localhost:${apiPort} …`);

  const child = spawn('npm', ['run', 'dev'], {
    cwd: apiDir,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      PORT: apiPort,
    },
  });

  child.on('exit', (code) => process.exit(code ?? 0));
}
