import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import Reports from '@/app/dashboard/reports';

function AccountReportsPage() {
  return <Reports />;
}

AccountReportsPage.getLayout = (page: ReactElement) => withAdminLayout(page);

export default AccountReportsPage;
