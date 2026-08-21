import type { AppProps } from 'next/app';
import type { NextPage } from 'next';
import Head from 'next/head';
import { ReactElement, ReactNode, Suspense, useEffect } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'react-hot-toast';
import '@/i18n';
import '@/tailwind.css';
import { store, IRootState } from '@/store';
import Error500 from '@/errors/500Error';
import {
  toggleRTL,
  toggleTheme,
  toggleMenu,
  toggleLayout,
  toggleAnimation,
  toggleNavbar,
  toggleSemidark,
  toggleLocale,
} from '@/store/themeConfigSlice';

export type NextPageWithLayout<P = Record<string, unknown>, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

function ThemeInitializer({ children }: { children: ReactNode }) {
  const themeConfig = useSelector((state: IRootState) => state.themeConfig);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(toggleTheme(localStorage.getItem('theme') || themeConfig.theme));
    dispatch(toggleMenu(localStorage.getItem('menu') || themeConfig.menu));
    dispatch(toggleLayout(localStorage.getItem('layout') || themeConfig.layout));
    dispatch(toggleRTL(localStorage.getItem('rtlClass') || themeConfig.rtlClass));
    dispatch(toggleAnimation(localStorage.getItem('animation') || themeConfig.animation));
    dispatch(toggleNavbar(localStorage.getItem('navbar') || themeConfig.navbar));
    dispatch(toggleSemidark(localStorage.getItem('semidark') || themeConfig.semidark));
    // Apply saved language only after mount to avoid hydration mismatch
    const saved =
      localStorage.getItem('i18nextLng') ||
      localStorage.getItem('locale') ||
      themeConfig.locale ||
      'en';
    const lng = saved.slice(0, 2);
    if (['en', 'rw', 'fr'].includes(lng)) {
      dispatch(toggleLocale(lng));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, [dispatch]);

  return (
    <div
      className={`${(store.getState().themeConfig.sidebar && 'toggle-sidebar') || ''} ${themeConfig.menu} ${themeConfig.layout} ${themeConfig.rtlClass} main-section antialiased relative font-roboto text-sm font-normal`}
    >
      {children}
    </div>
  );
}

function AppProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Provider store={store}>
        <ErrorBoundary FallbackComponent={Error500}>
          <Toaster position="top-center" reverseOrder={false} />
          <ThemeInitializer>{children}</ThemeInitializer>
        </ErrorBoundary>
      </Provider>
    </Suspense>
  );
}

export default function App({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? ((page: ReactElement) => page);

  return (
    <AppProvider>
      <Head>
        <title>Digital Farming</title>
      </Head>
      {getLayout(<Component {...pageProps} />)}
    </AppProvider>
  );
}
