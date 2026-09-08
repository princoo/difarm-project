import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import PlantingsPage from '@/app/dashboard/agriculture/plantings';

function Page() {
  return <PlantingsPage />;
}
Page.getLayout = (page: ReactElement) => withAdminLayout(page);
export default Page;
