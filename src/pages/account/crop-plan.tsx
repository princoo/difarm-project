import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import CropPlanPage from '@/app/dashboard/agriculture/crop-plan';

function Page() {
  return <CropPlanPage />;
}
Page.getLayout = (page: ReactElement) => withAdminLayout(page);
export default Page;
