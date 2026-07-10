import type { NextApiRequest, NextApiResponse } from 'next';
import { createApp } from '../../../../backend/src/createApp';

const app = createApp();

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

/**
 * Mounts the Express API under /api/v1/* on the same Next.js / Vercel host.
 * No separate API port required for production.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return app(req, res);
}
