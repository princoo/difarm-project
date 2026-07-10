import path from 'path';

/** Writable uploads directory (disk locally, /tmp on Vercel). */
export function uploadsRoot() {
  if (process.env.VERCEL) {
    return path.join('/tmp', 'uploads');
  }
  return path.join(process.cwd(), 'uploads');
}
