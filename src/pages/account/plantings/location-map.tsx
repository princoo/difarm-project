import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import LocationMapPage from '@/app/dashboard/farmbrite/plantings/location-map';

function Page() { return <LocationMapPage />; }
Page.getLayout = (page: ReactElement) => withAdminLayout(page);
export default Page;
