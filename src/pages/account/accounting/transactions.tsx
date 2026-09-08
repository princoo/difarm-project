import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import AccountingTransactionsPage from '@/app/dashboard/farmbrite/accounting/transactions';

function Page() { return <AccountingTransactionsPage />; }
Page.getLayout = (page: ReactElement) => withAdminLayout(page);
export default Page;
