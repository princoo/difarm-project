import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import TimesheetsPage from '@/app/dashboard/farmbrite/schedule/timesheets';

function Page() { return <TimesheetsPage />; }
Page.getLayout = (page: ReactElement) => withAdminLayout(page);
export default Page;
