import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import PlStatementPage from '@/app/dashboard/farmbrite/accounting/pl';

function Page() { return <PlStatementPage />; }
Page.getLayout = (page: ReactElement) => withAdminLayout(page);
export default Page;
