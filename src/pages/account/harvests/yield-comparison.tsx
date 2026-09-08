import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import YieldComparisonPage from '@/app/dashboard/farmbrite/plantings/yield-comparison';

function Page() { return <YieldComparisonPage />; }
Page.getLayout = (page: ReactElement) => withAdminLayout(page);
export default Page;
