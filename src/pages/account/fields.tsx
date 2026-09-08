import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import FieldsPage from '@/app/dashboard/agriculture/fields';

function Page() {
  return <FieldsPage />;
}
Page.getLayout = (page: ReactElement) => withAdminLayout(page);
export default Page;
