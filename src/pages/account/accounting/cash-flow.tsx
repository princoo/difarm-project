import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import CashFlowPage from '@/app/dashboard/farmbrite/accounting/cash-flow';

function Page() { return <CashFlowPage />; }
Page.getLayout = (page: ReactElement) => withAdminLayout(page);
export default Page;
