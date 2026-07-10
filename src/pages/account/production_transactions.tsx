import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import ProductionTransactions from '@/app/dashboard/productionTransactions';

function AccountProductionTransactionsPage() {
  return <ProductionTransactions />;
}

AccountProductionTransactionsPage.getLayout = (page: ReactElement) => withAdminLayout(page);

export default AccountProductionTransactionsPage;
