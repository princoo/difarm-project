import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

/** Railway / remote Postgres often drops idle sockets; keep pool small and reconnect-friendly. */
function databaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    if (!url.searchParams.has('connection_limit')) {
      // Local Next process: small pool. On Vercel serverless, prefer 1.
      url.searchParams.set(
        'connection_limit',
        process.env.VERCEL ? '1' : '5'
      );
    }
    if (!url.searchParams.has('pool_timeout')) {
      url.searchParams.set('pool_timeout', '20');
    }
    if (!url.searchParams.has('connect_timeout')) {
      url.searchParams.set('connect_timeout', '30');
    }
    return url.toString();
  } catch {
    return raw;
  }
}

function isConnectionError(err: unknown): boolean {
  const e = err as { code?: string; message?: string; meta?: { message?: string } };
  const code = e?.code || '';
  const msg = `${e?.message || ''} ${e?.meta?.message || ''}`;
  return (
    ['P1001', 'P1002', 'P1017', 'P2024'].includes(code) ||
    /ConnectionReset|ECONNRESET|forcibly closed|connection.*closed|Can't reach database|Server has closed the connection|Connection terminated/i.test(
      msg
    )
  );
}

function createPrismaClient() {
  const url = databaseUrl();
  const base = new PrismaClient({
    ...(url ? { datasources: { db: { url } } } : {}),
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

  // Retry once after a dropped idle connection (common with Railway proxies).
  return base.$extends({
    query: {
      async $allOperations({ args, query }) {
        try {
          return await query(args);
        } catch (err) {
          if (!isConnectionError(err)) throw err;
          console.warn(
            '[prisma] Database connection dropped; reconnecting and retrying once…'
          );
          try {
            await base.$disconnect();
          } catch {
            /* ignore */
          }
          await base.$connect();
          return query(args);
        }
      },
    },
  });
}

const prisma = globalForPrisma.prisma ?? createPrismaClient();
globalForPrisma.prisma = prisma;

export default prisma;
