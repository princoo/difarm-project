import dynamic from 'next/dynamic';
import { ReactElement } from 'react';

const AdminLayout = dynamic(() => import('./DefaultLayout'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen grid place-content-center bg-[#fafafa] dark:bg-[#060818]">
      <p className="text-gray-600 dark:text-gray-400">Loading dashboard…</p>
    </div>
  ),
});

export function withAdminLayout(page: ReactElement) {
  return <AdminLayout>{page}</AdminLayout>;
}

export type NextPageWithLayout<P = Record<string, unknown>> = {
  (props: P): React.ReactNode;
  getLayout?: (page: ReactElement) => React.ReactNode;
};
