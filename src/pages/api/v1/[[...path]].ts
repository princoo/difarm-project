import type { NextApiRequest, NextApiResponse } from 'next';
import serverless from 'serverless-http';
import { createApp } from '../../../../backend/src/createApp';

export const config = {
  api: {
    // Express parses the body; Next must not consume the stream first.
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

function getHandler(): ServerlessHandler {
  if (initError) throw initError;
  if (cached) return cached;
  try {
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

/** Ensure Express sees /api/v1/... even when Next strips the prefix. */
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
 * Mounts the Express API under /api/v1/* on the same Next.js / Vercel host.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    normalizeUrl(req);
    const run = getHandler();
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
          'Redeploy after pulling latest. Vercel env must include DATABASE_URL, JWT_SECRET, JWT_VERIF_SECRET.',
      });
    }
  }
}
