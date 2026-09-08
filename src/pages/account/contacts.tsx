import { ReactElement } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import ContactsPage from '@/app/dashboard/farmbrite/contacts';

function Page() { return <ContactsPage />; }
Page.getLayout = (page: ReactElement) => withAdminLayout(page);
export default Page;
