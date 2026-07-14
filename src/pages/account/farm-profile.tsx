import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import FarmProfilePage from '@/app/dashboard/farms/FarmProfilePage';

function AccountFarmProfilePage() {
  return <FarmProfilePage />;
}

AccountFarmProfilePage.getLayout = (page: ReactElement) => withAdminLayout(page);

export default AccountFarmProfilePage;
