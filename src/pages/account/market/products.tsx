import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import MarketProductsPage from '@/app/dashboard/farmbrite/market/products';

function Page() { return <MarketProductsPage />; }
Page.getLayout = (page: ReactElement) => withAdminLayout(page);
export default Page;
