import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import ProductionTotals from '@/app/dashboard/productionTotals';

function AccountProductionTotalsPage() {
  return <ProductionTotals />;
}

AccountProductionTotalsPage.getLayout = (page: ReactElement) => withAdminLayout(page);

export default AccountProductionTotalsPage;
