import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import EquipmentPage from '@/app/dashboard/farmbrite/resources/equipment';

function Page() { return <EquipmentPage />; }
Page.getLayout = (page: ReactElement) => withAdminLayout(page);
export default Page;
