import type { NextApiRequest, NextApiResponse } from 'next';

/** Express-free API health (takes precedence over catch-all). */
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    ok: true,
    service: 'difarm-api',
    vercel: Boolean(process.env.VERCEL || process.env.VERCEL_ENV),
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    hasJwtSecret: Boolean(process.env.JWT_SECRET),
    hasJwtVerifSecret: Boolean(process.env.JWT_VERIF_SECRET),
  });
}
