import path from 'path';
import fs from 'fs';
import type { Express } from 'express';
import dotenv from 'dotenv';
import router from './router';
import ErrorHandler from './middleware/errorHandler.middleware';
import { uploadsRoot } from './util/uploadsPath';
import { express, session, cors, passport, morgan } from './util/cjsDeps';
import './config/passportLocal';

dotenv.config();

export { uploadsRoot };

/** Shared Express app for local standalone server and Next.js / Vercel. */
export function createApp(): Express {
  const app = express();
  const uploadRoot = uploadsRoot();
  try {
    fs.mkdirSync(path.join(uploadRoot, 'vaccinations'), { recursive: true });
  } catch (err) {
    console.warn('[createApp] uploads mkdir failed:', err);
  }

  const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.FRONTEND_UrL,
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
  ].filter((origin): origin is string => Boolean(origin));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  if (process.env.NODE_ENV !== 'production' && typeof morgan === 'function') {
    app.use(morgan('dev'));
  }

  app.use(
    cors({
      origin: (
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void
      ) => {
        let isVercel = false;
        try {
          isVercel =
            typeof origin === 'string' &&
            /\.vercel\.app$/i.test(new URL(origin).hostname);
        } catch {
          isVercel = false;
        }
        const isLocalhost =
          typeof origin === 'string' && /^http:\/\/localhost:\d+$/.test(origin);

        if (!origin || allowedOrigins.includes(origin) || isLocalhost || isVercel) {
          callback(null, true);
        } else {
          callback(new Error(`CORS blocked for origin: ${origin}`));
        }
      },
      credentials: true,
    })
  );

  app.use('/uploads', express.static(uploadRoot));

  // Session is best-effort on Vercel (MemoryStore). Auth uses JWT in the response body.
  app.use(
    session({
      secret: process.env.JWT_SECRET || 'difarm-session-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.VERCEL === '1',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());

  app.get('/api/v1/health', (_req, res) => {
    res.status(200).json({
      ok: true,
      service: 'difarm-api',
      vercel: Boolean(process.env.VERCEL),
    });
  });

  app.use('/api/v1', router);
  app.use(ErrorHandler);

  return app;
}
