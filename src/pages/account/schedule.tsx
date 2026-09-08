import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import SchedulePage from '@/app/dashboard/farmbrite/schedule';

function Page() {
  return <SchedulePage />;
}
Page.getLayout = (page: ReactElement) => withAdminLayout(page);
export default Page;
