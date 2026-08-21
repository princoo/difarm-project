import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { tEn } from '@/i18n';

type TOptions = Record<string, string | number | boolean | null | undefined>;

function applyOptions(template: string, options?: TOptions): string {
  if (!options) return template;
  return Object.entries(options).reduce((text, [key, value]) => {
    if (value == null) return text;
    return text.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), String(value));
  }, template);
}

/**
 * Hydration-safe translator:
 * - SSR + first client paint always use English from bundled JSON (identical HTML)
 * - After mount, use the active i18n language (en / rw / fr)
 */
export function useSafeT() {
  const { t, i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const safeT = useCallback(
    (key: string, options?: TOptions) => {
      if (!mounted) return applyOptions(tEn(key), options);
      const value = t(key, options);
      if (value === key) return applyOptions(tEn(key), options);
      return typeof value === 'string' ? value : String(value);
    },
    [mounted, t]
  );

  return { t: safeT, i18n, mounted };
}
