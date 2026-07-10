import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import FarmsList from '@/app/dashboard/farms';

function AccountFarmsPage() {
  return <FarmsList />;
}

AccountFarmsPage.getLayout = (page: ReactElement) => withAdminLayout(page);

export default AccountFarmsPage;
