import path from 'path';
import { createRequire } from 'module';

/**
 * Always load Prisma from the workspace root.
 * backend/node_modules can hold a stale @prisma/client without newer models.
 * process.cwd() is the project root on Vercel and locally.
 */
const requireFromRoot = createRequire(path.join(process.cwd(), 'package.json'));
const { PrismaClient } = requireFromRoot('@prisma/client') as typeof import('@prisma/client');

const globalForPrisma = globalThis as unknown as { prisma?: InstanceType<typeof PrismaClient> };

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
