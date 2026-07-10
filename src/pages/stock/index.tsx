import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import Widget from '@/app/dashboard/Widget';

function StockOverviewPage() {
  return <Widget />;
}

StockOverviewPage.getLayout = (page: ReactElement) => withAdminLayout(page);

export default StockOverviewPage;
