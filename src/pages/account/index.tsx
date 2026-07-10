import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import Overview from '@/app/dashboard/OverView';

function AccountOverviewPage() {
  return <Overview />;
}

AccountOverviewPage.getLayout = (page: ReactElement) => withAdminLayout(page);

export default AccountOverviewPage;
