import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import FarmDetail from '@/app/dashboard/farms/FarmDetail';

function AccountFarmDetailPage() {
  return <FarmDetail />;
}

AccountFarmDetailPage.getLayout = (page: ReactElement) => withAdminLayout(page);

export default AccountFarmDetailPage;
