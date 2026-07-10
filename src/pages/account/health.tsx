import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import Health from '@/app/dashboard/health';

function AccountHealthPage() {
  return <Health />;
}

AccountHealthPage.getLayout = (page: ReactElement) => withAdminLayout(page);

export default AccountHealthPage;
