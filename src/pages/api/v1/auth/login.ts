import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../../backend/src/db/prisma';
import { comparePassword } from '../../../../../backend/src/service/bcrypt.service';
import { generateToken } from '../../../../../backend/src/service/token.service';
import { createLog } from '../../../../../backend/src/service/activityLog.service';

/**
 * Native Next.js login (no Express). Takes precedence over /api/v1/[[...path]].
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({
        message:
          'DATABASE_URL is not set in Vercel Environment Variables. Add it and redeploy.',
      });
    }
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: 'JWT_SECRET is not set in Vercel Environment Variables.',
      });
    }

    const username = String(req.body?.username ?? '').trim();
    const password = String(req.body?.password ?? '');
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const userFound = await prisma.account.findFirst({
      where: {
        OR: [{ username }, { email: username }, { phone: username }],
      },
    });

    if (!userFound) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    if (!userFound.status) {
      return res.status(400).json({
        message:
          'Your account is pending activation. Please contact the super admin.',
      });
    }

    const ok = userFound.password
      ? await comparePassword(password, userFound.password)
      : false;
    if (!ok) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const userData = await prisma.user.findFirst({
      where: { accountId: userFound.id },
    });

    const userDataPayLoad = {
      id: userFound.id,
      userId: userData?.id,
      username: userFound.username,
      email: userFound.email,
      role: userFound.role,
      status: userFound.status,
    };

    const token = generateToken(userDataPayLoad);
    const user = {
      userFound: {
        id: userFound.id,
        userId: userData?.id,
        username: userFound.username,
        email: userFound.email,
        phone: userFound.phone,
        role: userFound.role,
        status: userFound.status,
      },
      token,
    };

    createLog({
      accountId: userFound.id,
      userId: userData?.id,
      action: 'LOGIN',
      entityType: 'auth',
      details: 'User logged in',
    }).catch(() => {});

    return res.status(200).json({
      message: 'Login successful',
      user,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Login failed';
    console.error('[api/v1/auth/login]', err);
    return res.status(500).json({
      message,
      stack: err instanceof Error ? err.stack : undefined,
    });
  }
}
