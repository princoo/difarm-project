import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import ProfilePage from '@/app/profile';

function AccountProfilePage() {
  return <ProfilePage />;
}

AccountProfilePage.getLayout = (page: ReactElement) => withAdminLayout(page);

export default AccountProfilePage;
