import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import MarketPage from '@/app/dashboard/farmbrite/market';

function Page() { return <MarketPage />; }
Page.getLayout = (page: ReactElement) => withAdminLayout(page);
export default Page;
