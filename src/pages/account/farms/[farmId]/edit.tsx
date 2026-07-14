import { ReactElement } from 'react';
import dynamic from 'next/dynamic';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';

const EditFarmPage = dynamic(
  () => import('@/app/dashboard/farms/EditFarmPage'),
  { ssr: false }
);

function AccountEditFarmPage() {
  return <EditFarmPage />;
}

AccountEditFarmPage.getLayout = (page: ReactElement) => withAdminLayout(page);

export default AccountEditFarmPage;
