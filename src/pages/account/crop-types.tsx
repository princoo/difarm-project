import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import CropTypesPage from '@/app/dashboard/agriculture/crop-types';

function Page() {
  return <CropTypesPage />;
}
Page.getLayout = (page: ReactElement) => withAdminLayout(page);
export default Page;
