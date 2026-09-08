import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import WarehousesPage from '@/app/dashboard/farmbrite/resources/warehouses';

function Page() { return <WarehousesPage />; }
Page.getLayout = (page: ReactElement) => withAdminLayout(page);
export default Page;
