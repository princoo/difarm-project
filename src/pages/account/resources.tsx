import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import ResourcesPage from '@/app/dashboard/farmbrite/resources';

function Page() { return <ResourcesPage />; }
Page.getLayout = (page: ReactElement) => withAdminLayout(page);
export default Page;
