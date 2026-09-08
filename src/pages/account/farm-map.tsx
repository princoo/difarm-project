import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import FarmMapPage from '@/app/dashboard/farmbrite/farm-map';

function Page() { return <FarmMapPage />; }
Page.getLayout = (page: ReactElement) => withAdminLayout(page);
export default Page;
