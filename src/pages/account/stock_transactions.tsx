import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import StockTransactionManagement from '@/app/dashboard/stock_transaction';

function AccountStockTransactionsPage() {
  return <StockTransactionManagement />;
}

AccountStockTransactionsPage.getLayout = (page: ReactElement) => withAdminLayout(page);

export default AccountStockTransactionsPage;
