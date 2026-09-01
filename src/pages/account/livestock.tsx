import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import LivestockList from '@/app/dashboard/livestock';

function AccountLivestockPage() {
  return <LivestockList />;
}

AccountLivestockPage.getLayout = (page: ReactElement) => withAdminLayout(page);

export default AccountLivestockPage;
