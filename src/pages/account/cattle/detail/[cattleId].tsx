import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import CattleDetail from '@/app/dashboard/cattles/CattleDetail';

function AccountCattleDetailPage() {
  return <CattleDetail />;
}

AccountCattleDetailPage.getLayout = (page: ReactElement) => withAdminLayout(page);

export default AccountCattleDetailPage;
