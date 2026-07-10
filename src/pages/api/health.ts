import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Express-free health check so we can verify the Vercel function runtime
 * even if /api/v1 is still warming or failing.
 */
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    ok: true,
    service: 'difarm-next',
    vercel: Boolean(process.env.VERCEL),
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    hasJwtSecret: Boolean(process.env.JWT_SECRET),
    hasJwtVerifSecret: Boolean(process.env.JWT_VERIF_SECRET),
  });
}
