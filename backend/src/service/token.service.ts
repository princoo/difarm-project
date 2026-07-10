import dotenv from 'dotenv';
import Jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import prisma from '../db/prisma';
import { AccountI } from '../interface/account.interface';

dotenv.config();

interface EmailVerifyI {
    userId: string
}

const requireEnv = (key: string): string => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required env var: ${key}`);
    }
    return value;
};

const JWT_SECRET: Secret = requireEnv("JWT_SECRET");
const JWT_VERIF_SECRET: Secret = requireEnv("JWT_VERIF_SECRET");
const EXPIRE_TIME = process.env.EXPIRE_TIME as unknown as SignOptions["expiresIn"];
const EXPIRE_VERIF_TIME = process.env.EXPIRE_VERIF_TIME as unknown as SignOptions["expiresIn"];

const generateToken = (data: any) => {
    const token = Jwt.sign({ data }, JWT_SECRET, {
        expiresIn: EXPIRE_TIME,
    });
    return token;
};

const generateEmailVerificationToken = (data: EmailVerifyI) => {
    const token = Jwt.sign({ data }, JWT_VERIF_SECRET, {
        expiresIn: EXPIRE_VERIF_TIME,
    });
    return token;
};
const generateForgotPasswordToken = (data: {email: string, id: string}) => {
    const token = Jwt.sign({ data }, JWT_SECRET);
    return token;
};

const verifyToken = (token: string, type: string): any => {
    if (type === "verify-email") {
        return Jwt.verify(token, JWT_VERIF_SECRET, (err, decoded) => {
            if (err) {
                return err;
            }
            return decoded;
        });
    }

    return Jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return err;
        }
        return decoded;
    });
};
export { generateToken, generateEmailVerificationToken, verifyToken, generateForgotPasswordToken };
