import type { NextApiRequest, NextApiResponse } from 'next';
import type { Express } from 'express';

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

let app: Express | null = null;
let initError: Error | null = null;

function getApp(): Express {
  if (initError) throw initError;
  if (app) return app;
  try {
    // Lazy require so missing env / Prisma errors become JSON 500s, not opaque Next HTML.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createApp } = require('../../../../backend/src/createApp') as {
      createApp: () => Express;
    };
    app = createApp();
    return app;
  } catch (err) {
    initError = err instanceof Error ? err : new Error(String(err));
    console.error('[api/v1] Failed to start Express app:', initError);
    throw initError;
  }
}

/**
 * Mounts the Express API under /api/v1/* on the same Next.js / Vercel host.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    return getApp()(req, res);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'API failed to start';
    console.error('[api/v1] handler error:', err);
    if (!res.headersSent) {
      res.status(500).json({
        ok: false,
        message,
        hint:
          'Set DATABASE_URL, JWT_SECRET, and JWT_VERIF_SECRET in Vercel Environment Variables, then redeploy.',
      });
    }
  }
}
