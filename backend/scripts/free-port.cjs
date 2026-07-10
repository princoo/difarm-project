const { execSync } = require('node:child_process');

const port = process.argv[2] || process.env.PORT || '4000';

if (process.platform !== 'win32') {
  process.exit(0);
}

try {
  const output = execSync(`netstat -ano | findstr :${port}`, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'ignore'],
  });
  const pids = new Set();
  for (const line of output.split(/\r?\n/)) {
    if (!line.includes('LISTENING')) continue;
    const pid = line.trim().split(/\s+/).pop();
    if (pid && pid !== '0') pids.add(pid);
  }
  for (const pid of pids) {
    execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
    console.log(`Freed port ${port} (stopped PID ${pid})`);
  }
} catch {
  // port already free
}
