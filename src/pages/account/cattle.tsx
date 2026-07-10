import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import CattleList from '@/app/dashboard/cattles';

function AccountCattlePage() {
  return <CattleList />;
}

AccountCattlePage.getLayout = (page: ReactElement) => withAdminLayout(page);

export default AccountCattlePage;
