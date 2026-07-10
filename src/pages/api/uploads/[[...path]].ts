import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { uploadsRoot } from '../../../../backend/src/util/uploadsPath';

export const config = {
  api: {
    bodyParser: false,
  },
};

/** Serves uploaded files (e.g. vaccine scans) from disk or /tmp on Vercel. */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const parts = req.query.path;
  const segments = Array.isArray(parts) ? parts : parts ? [parts] : [];
  if (segments.some((s) => s.includes('..') || s.includes('\\'))) {
    res.status(400).end('Invalid path');
    return;
  }

  const root = uploadsRoot();
  const filePath = path.join(root, ...segments);
  if (!filePath.startsWith(root) || !fs.existsSync(filePath)) {
    res.status(404).end('Not found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const types: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
  };
  res.setHeader('Content-Type', types[ext] || 'application/octet-stream');
  fs.createReadStream(filePath).pipe(res);
}
