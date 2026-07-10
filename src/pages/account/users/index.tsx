import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import Users from '@/app/dashboard/users';

function AccountUsersPage() {
  return <Users />;
}

AccountUsersPage.getLayout = (page: ReactElement) => withAdminLayout(page);

export default AccountUsersPage;
