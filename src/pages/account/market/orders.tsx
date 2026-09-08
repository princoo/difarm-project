import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import MarketOrdersPage from '@/app/dashboard/farmbrite/market/orders';

function Page() { return <MarketOrdersPage />; }
Page.getLayout = (page: ReactElement) => withAdminLayout(page);
export default Page;
