import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const apiDir = path.join(root, 'backend');

console.log('DiFarm setup — all from difarm-next\n');

if (!fs.existsSync(apiDir)) {
  console.error('Missing backend/ folder.');
  process.exit(1);
}

console.log('1/3 Installing root dependencies…');
spawnSync('npm', ['install'], { cwd: root, stdio: 'inherit', shell: true });

console.log('\n2/3 Installing API dependencies…');
const apiInstall = spawnSync('npm', ['install'], { cwd: apiDir, stdio: 'inherit', shell: true });
if (apiInstall.status !== 0) process.exit(apiInstall.status ?? 1);

console.log('\n3/3 Generating Prisma client…');
const gen = spawnSync(
  'npx',
  ['prisma', 'generate', '--schema=prisma/schema.prisma'],
  { cwd: root, stdio: 'inherit', shell: true },
);
if (gen.status !== 0) process.exit(gen.status ?? 1);

console.log('\nSetup complete. Run: npm run dev');
console.log('  App → http://localhost:3003');
console.log('  API → http://localhost:4000');
