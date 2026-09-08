import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import MarketSettingsPage from '@/app/dashboard/farmbrite/market/settings';

function Page() { return <MarketSettingsPage />; }
Page.getLayout = (page: ReactElement) => withAdminLayout(page);
export default Page;
