import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import themeConfig from './theme.config';
import en from '@/locales/en/translation.json';
import rw from '@/locales/rw/translation.json';
import fr from '@/locales/fr/translation.json';

export const supportedLngs = ['en', 'rw', 'fr'] as const;

const resources = {
  en: { translation: en },
  rw: { translation: rw },
  fr: { translation: fr },
};

/** Read a nested key from the English catalog (SSR-safe fallback). */
export function tEn(key: string): string {
  const parts = key.split('.');
  let cur: unknown = en;
  for (const part of parts) {
    if (cur == null || typeof cur !== 'object') return key;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === 'string' ? cur : key;
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: themeConfig.locale || 'en',
    fallbackLng: 'en',
    supportedLngs: [...supportedLngs],
    debug: false,
    load: 'languageOnly',
    ns: ['translation'],
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    initImmediate: true,
  });
} else {
  // HMR: ensure resources stay attached after hot reload
  Object.entries(resources).forEach(([lng, ns]) => {
    i18n.addResourceBundle(lng, 'translation', ns.translation, true, true);
  });
}

export default i18n;
