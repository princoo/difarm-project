import { storage } from '@/utils';
import axios from 'axios';

function sanitizeEnvUrl(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim().replace(/\/$/, '');
  if (
    !trimmed ||
    trimmed === 'undefined' ||
    trimmed === 'null' ||
    trimmed === 'false'
  ) {
    return '';
  }
  return trimmed;
}

/**
 * API host (no trailing slash). Empty = same origin as this Next/Vercel app.
 * Never returns the string "undefined".
 */
export function resolveApiBaseURL(): string {
  const fromEnv = sanitizeEnvUrl(
    process.env.NEXT_PUBLIC_SERVER_URL || process.env.REACT_APP_SERVER_URL
  );

  // On Vercel / production UI, never call localhost — use same origin.
  if (typeof window !== 'undefined') {
    const onLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(
      window.location.origin
    );
    if (fromEnv && /localhost|127\.0\.0\.1/i.test(fromEnv) && !onLocalhost) {
      return '';
    }
    // Prefer same-origin whenever env is missing/invalid
    if (!fromEnv) return '';
    return fromEnv;
  }

  if (fromEnv) return fromEnv;

  if (process.env.VERCEL_URL) {
    return `https://${sanitizeEnvUrl(process.env.VERCEL_URL)}`;
  }

  return '';
}

function apiPath(base: string): string {
  // Always absolute path on same origin: "/api/v1"
  // Never produce "undefined/api/v1"
  if (!base) return '/api/v1';
  return `${base}/api/v1`;
}

export const baseURL = resolveApiBaseURL();

export const api = axios.create({
  baseURL: apiPath(baseURL),
});

api.interceptors.request.use(
  (config) => {
    config.baseURL = apiPath(resolveApiBaseURL());
    const tokenId = storage.getToken();
    if (tokenId) {
      config.headers.Authorization = `Bearer ${tokenId}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const queryString = (
  query?: string | URLSearchParams | Record<string, unknown>
): string => {
  if (!query) return '';
  if (query instanceof URLSearchParams) return query.toString();
  if (typeof query === 'string') {
    return query.startsWith('?') ? query.slice(1) : query;
  }
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value != null && value !== '') {
      params.set(key, String(value));
    }
  }
  return params.toString();
};
