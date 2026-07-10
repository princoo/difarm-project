import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import StockManagement from '@/app/dashboard/stock';

function AccountStockPage() {
  return <StockManagement />;
}

AccountStockPage.getLayout = (page: ReactElement) => withAdminLayout(page);

export default AccountStockPage;
