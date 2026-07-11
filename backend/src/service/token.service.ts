import dotenv from 'dotenv';
import Jwt, { type Secret, type SignOptions } from 'jsonwebtoken';

dotenv.config();

interface EmailVerifyI {
  userId: string;
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

function jwtSecret(): Secret {
  return requireEnv('JWT_SECRET');
}

function jwtVerifSecret(): Secret {
  return requireEnv('JWT_VERIF_SECRET');
}

function expireTime(): SignOptions['expiresIn'] {
  return (process.env.EXPIRE_TIME || '7d') as SignOptions['expiresIn'];
}

function expireVerifTime(): SignOptions['expiresIn'] {
  return (process.env.EXPIRE_VERIF_TIME || '24h') as SignOptions['expiresIn'];
}

const generateToken = (data: any) => {
  return Jwt.sign({ data }, jwtSecret(), {
    expiresIn: expireTime(),
  });
};

const generateEmailVerificationToken = (data: EmailVerifyI) => {
  return Jwt.sign({ data }, jwtVerifSecret(), {
    expiresIn: expireVerifTime(),
  });
};

const generateForgotPasswordToken = (data: { email: string; id: string }) => {
  return Jwt.sign({ data }, jwtSecret());
};

const verifyToken = (token: string, type: string): any => {
  try {
    if (type === 'verify-email') {
      return Jwt.verify(token, jwtVerifSecret());
    }
    return Jwt.verify(token, jwtSecret());
  } catch {
    return null;
  }
};

export {
  generateToken,
  generateEmailVerificationToken,
  verifyToken,
  generateForgotPasswordToken,
};
