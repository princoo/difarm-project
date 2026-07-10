import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

type ServerlessHandler = (
  req: NextApiRequest,
  res: NextApiResponse
) => Promise<unknown>;

let cached: ServerlessHandler | null = null;
let initError: Error | null = null;

async function getHandler(): Promise<ServerlessHandler> {
  if (initError) throw initError;
  if (cached) return cached;
  try {
    // Dynamic import so module-load failures become JSON 500s, not Next HTML 500.
    const { createApp } = await import('../../../../backend/src/createApp');
    const serverless = (await import('serverless-http')).default;
    const app = createApp();
    cached = serverless(app, {
      binary: [
        'image/*',
        'application/pdf',
        'application/octet-stream',
        'multipart/form-data',
      ],
    }) as unknown as ServerlessHandler;
    return cached;
  } catch (err) {
    initError = err instanceof Error ? err : new Error(String(err));
    console.error('[api/v1] createApp failed:', initError);
    throw initError;
  }
}

function normalizeUrl(req: NextApiRequest) {
  const current = req.url || '/';
  if (current.startsWith('/api/v1')) return;

  const parts = req.query.path;
  const rest = Array.isArray(parts)
    ? parts.map(String).join('/')
    : parts
      ? String(parts)
      : '';
  const qsIndex = current.indexOf('?');
  const qs = qsIndex >= 0 ? current.slice(qsIndex) : '';
  req.url = rest ? `/api/v1/${rest}${qs}` : `/api/v1${qs || ''}`;
}

/**
 * Catch-all for remaining /api/v1/* routes (login/health have dedicated pages).
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({
        ok: false,
        message:
          'DATABASE_URL is not set in Vercel Environment Variables. Add your Railway Postgres URL and redeploy.',
      });
    }
    normalizeUrl(req);
    const run = await getHandler();
    await run(req, res);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'API failed to start';
    console.error('[api/v1] handler error:', err);
    if (!res.headersSent) {
      res.status(500).json({
        ok: false,
        message,
        stack: err instanceof Error ? err.stack : undefined,
        hint:
          'Set DATABASE_URL, JWT_SECRET, JWT_VERIF_SECRET in Vercel → Settings → Environment Variables, then Redeploy.',
      });
    }
  }
}
