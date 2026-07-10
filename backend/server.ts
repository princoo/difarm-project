import { createApp } from './src/createApp';

const app = createApp();

const shouldListen =
  process.env.DIFARM_STANDALONE_API === '1' ||
  process.argv.some((a) => a.includes('server.ts') || a.includes('server.js'));

if (shouldListen) {
  const port = Number(process.env.PORT) || 4000;
  app.listen(port, () => {
    console.log(`Standalone API listening on http://localhost:${port}`);
  });
}

export default app;
