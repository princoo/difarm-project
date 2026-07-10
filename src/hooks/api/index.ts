
import { storage } from '@/utils';
import axios from 'axios';

export const baseURL =
  process.env.NEXT_PUBLIC_SERVER_URL ?? process.env.REACT_APP_SERVER_URL;

export const api = axios.create({
  baseURL: `${baseURL}/api/v1`
});

api.interceptors.request.use(
    (config) => {
      const tokenId = storage.getToken();
      if (tokenId) {
        config.headers.Authorization = `Bearer ${tokenId}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
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