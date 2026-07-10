import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import Production from '@/app/dashboard/production';

function AccountProductionPage() {
  return <Production />;
}

AccountProductionPage.getLayout = (page: ReactElement) => withAdminLayout(page);

export default AccountProductionPage;
