import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import BalanceSheetPage from '@/app/dashboard/farmbrite/accounting/balance-sheet';

function Page() { return <BalanceSheetPage />; }
Page.getLayout = (page: ReactElement) => withAdminLayout(page);
export default Page;
