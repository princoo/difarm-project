'use client';

import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeT } from '@/hooks/useSafeT';
import { IRootState } from '@/store';
import { toggleLocale } from '@/store/themeConfigSlice';

/** Native labels — avoid depending on async t() for the control itself */
const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'rw', label: 'Ikinyarwanda', short: 'RW' },
  { code: 'fr', label: 'Français', short: 'FR' },
] as const;

type Props = {
  compact?: boolean;
  className?: string;
};

export default function LanguageSwitcher({ compact = false, className = '' }: Props) {
  const { t, i18n, mounted } = useSafeT();
  const dispatch = useDispatch();
  const locale = useSelector((state: IRootState) => state.themeConfig.locale);

  const activeCode = mounted
    ? (i18n.language || locale || 'en').slice(0, 2)
    : 'en';
  const current =
    LANGUAGES.find((l) => l.code === activeCode) || LANGUAGES[0];

  const changeLanguage = (code: string) => {
    dispatch(toggleLocale(code));
  };

  return (
    <Menu as="div" className={`relative inline-block text-left ${className}`}>
      <Menu.Button
        type="button"
        className={
          compact
            ? 'inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-dark/40 dark:text-white'
            : 'inline-flex items-center gap-1.5 rounded-full bg-white-light/40 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-white-light/90 hover:text-primary dark:bg-dark/40 dark:text-[#d0d2d6] dark:hover:bg-dark/60'
        }
        aria-label={t('language')}
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.8 3.8 5.8 3.8 9s-1.3 6.2-3.8 9c-2.5-2.8-3.8-5.8-3.8-9S9.5 5.8 12 3z" />
        </svg>
        <span>{compact ? current.short : current.label}</span>
        <svg
          className="h-3.5 w-3.5 opacity-70"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-50 mt-2 w-44 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none dark:bg-gray-900 dark:ring-white/10">
          <div className="py-1">
            <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              {t('language')}
            </p>
            {LANGUAGES.map((lang) => {
              const active = current.code === lang.code;
              return (
                <Menu.Item key={lang.code}>
                  {({ active: hovered }) => (
                    <button
                      type="button"
                      onClick={() => changeLanguage(lang.code)}
                      className={`${
                        hovered ? 'bg-gray-50 dark:bg-gray-800' : ''
                      } ${
                        active
                          ? 'text-primary font-semibold'
                          : 'text-gray-700 dark:text-gray-200'
                      } flex w-full items-center justify-between px-3 py-2 text-sm`}
                    >
                      <span>{lang.label}</span>
                      <span className="text-xs text-gray-400">{lang.short}</span>
                    </button>
                  )}
                </Menu.Item>
              );
            })}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
