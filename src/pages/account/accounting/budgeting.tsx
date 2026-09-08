import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import BudgetingPage from '@/app/dashboard/farmbrite/accounting/budgeting';

function Page() { return <BudgetingPage />; }
Page.getLayout = (page: ReactElement) => withAdminLayout(page);
export default Page;
