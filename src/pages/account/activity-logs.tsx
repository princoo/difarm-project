import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import ActivityLogs from '@/app/dashboard/activityLogs';

function AccountActivityLogsPage() {
  return <ActivityLogs />;
}

AccountActivityLogsPage.getLayout = (page: ReactElement) => withAdminLayout(page);

export default AccountActivityLogsPage;
