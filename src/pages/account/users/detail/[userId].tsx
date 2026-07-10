import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import UserDetail from '@/app/dashboard/users/UserDetail';

function AccountUserDetailPage() {
  return <UserDetail />;
}

AccountUserDetailPage.getLayout = (page: ReactElement) => withAdminLayout(page);

export default AccountUserDetailPage;
