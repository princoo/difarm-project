import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import ActivitiesPage from '@/app/dashboard/activities';

function Page() {
  return <ActivitiesPage />;
}
Page.getLayout = (page: ReactElement) => withAdminLayout(page);
export default Page;
