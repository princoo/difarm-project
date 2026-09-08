import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import HarvestsPage from '@/app/dashboard/agriculture/harvests';

function Page() {
  return <HarvestsPage />;
}
Page.getLayout = (page: ReactElement) => withAdminLayout(page);
export default Page;
