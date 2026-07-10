import path from 'path';
import { createRequire } from 'module';

// Prisma client is generated at the workspace root (difarm-next/node_modules).
// The backend package also has its own nested @prisma/client copy that can go stale.
const requireFromRoot = createRequire(path.join(__dirname, '../../../package.json'));
const { PrismaClient } = requireFromRoot('@prisma/client');

const prisma = new PrismaClient();

export default prisma;