import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { ComponentProps, forwardRef, ReactNode, useCallback, useMemo } from 'react';

type NavigateTarget =
  | string
  | number
  | { pathname?: string; search?: string; hash?: string };

export function useNavigate() {
  const router = useRouter();
  return useCallback(
    (to: NavigateTarget, options?: { replace?: boolean; state?: unknown }) => {
      if (typeof to === 'number') {
        window.history.go(to);
        return;
      }
      if (typeof to === 'object') {
        const pathname =
          to.pathname ??
          router.asPath.split('?')[0].split('#')[0] ??
          router.pathname;
        const queryString = to.search?.replace(/^\?/, '') ?? '';
        const hash = to.hash ?? '';
        const url = `${pathname}${queryString ? `?${queryString}` : ''}${hash}`;
        if (options?.replace) {
          router.replace(url);
        } else {
          router.push(url);
        }
        return;
      }
      if (options?.replace) {
        router.replace(to);
      } else {
        router.push(to);
      }
    },
    [router]
  );
}

export function useLocation() {
  const router = useRouter();
  const pathname = useMemo(() => {
    const fromAsPath = router.asPath.split('?')[0].split('#')[0];
    return fromAsPath || router.pathname;
  }, [router.asPath, router.pathname]);

  return {
    pathname,
    search: typeof window !== 'undefined' ? window.location.search : '',
    hash: typeof window !== 'undefined' ? window.location.hash : '',
    state: undefined as unknown,
    key: router.asPath,
  };
}

export function useParams<
  T extends Record<string, string | string[] | undefined> = Record<string, string | string[] | undefined>,
>() {
  const router = useRouter();
  return router.query as T;
}

export function useSearchParams(): [URLSearchParams, (params: URLSearchParams) => void] {
  const router = useRouter();

  const search = useMemo(() => {
    const queryIndex = router.asPath.indexOf('?');
    return queryIndex >= 0
      ? router.asPath.slice(queryIndex + 1).split('#')[0]
      : '';
  }, [router.asPath]);

  const searchParams = useMemo(() => new URLSearchParams(search), [search]);

  const setSearchParams = useCallback(
    (params: URLSearchParams) => {
      const query: Record<string, string> = {};
      params.forEach((value, key) => {
        query[key] = value;
      });
      router.push({ pathname: router.pathname, query }, undefined, { shallow: true });
    },
    [router]
  );

  return [searchParams, setSearchParams];
}

type LinkProps = Omit<ComponentProps<typeof NextLink>, 'href'> & {
  to?: string;
  href?: string;
};

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { to, href, children, ...props },
  ref
) {
  const destination = to ?? href ?? '/';
  return (
    <NextLink ref={ref} href={destination} {...props}>
      {children}
    </NextLink>
  );
});

export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  const router = useRouter();
  if (replace) {
    router.replace(to);
  } else {
    router.push(to);
  }
  return null;
}

export function Outlet({ children }: { children?: ReactNode }) {
  return children ?? null;
}

/** Legacy react-router shims — Next.js pages router handles routing in `pages/`. */
export function BrowserRouter({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function Routes({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function Route(_props: { path?: string; element?: ReactNode; index?: boolean; children?: ReactNode }) {
  void _props;
  return null;
}
