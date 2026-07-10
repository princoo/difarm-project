/**
 * Central Express/CJS deps with safe default-export interop for Next/Vercel.
 * Express 4 is CJS; webpack sometimes wraps it as { default: fn }.
 */
import expressImport from 'express';
import sessionImport from 'express-session';
import corsImport from 'cors';
import passportImport from 'passport';
import morganImport from 'morgan';

function unwrap<T>(mod: T): T {
  const m = mod as T & { default?: T };
  if (m && typeof (m as unknown) === 'object' && 'default' in m && (m as { default?: unknown }).default != null) {
    const d = (m as { default: T }).default;
    // Prefer default when it looks like the real export (function or object with useful props)
    if (typeof d === 'function' || (d && typeof d === 'object')) return d;
  }
  return mod;
}

export const express = unwrap(expressImport) as typeof expressImport;
export const session = unwrap(sessionImport) as typeof sessionImport;
export const cors = unwrap(corsImport) as typeof corsImport;
export const passport = unwrap(passportImport) as typeof passportImport;
export const morgan = unwrap(morganImport) as typeof morganImport;

if (typeof express !== 'function') {
  throw new Error(
    `[cjsDeps] express is ${typeof express}. Check that express@4 is installed.`
  );
}

export const Router = express.Router.bind(express) as typeof express.Router;

export type {
  Request,
  Response,
  NextFunction,
  Express,
  RequestHandler,
  ErrorRequestHandler,
} from 'express';
