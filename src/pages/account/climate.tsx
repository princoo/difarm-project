import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import ClimatePage from '@/app/dashboard/farmbrite/climate';

function Page() { return <ClimatePage />; }
Page.getLayout = (page: ReactElement) => withAdminLayout(page);
export default Page;
