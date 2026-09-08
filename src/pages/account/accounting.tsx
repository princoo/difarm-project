import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import AccountingPage from '@/app/dashboard/farmbrite/accounting';

function Page() { return <AccountingPage />; }
Page.getLayout = (page: ReactElement) => withAdminLayout(page);
export default Page;
