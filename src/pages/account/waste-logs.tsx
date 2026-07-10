import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import WasteLogManagement from '@/app/dashboard/waste';

function AccountWasteLogsPage() {
  return <WasteLogManagement />;
}

AccountWasteLogsPage.getLayout = (page: ReactElement) => withAdminLayout(page);

export default AccountWasteLogsPage;
