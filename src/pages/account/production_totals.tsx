import { ReactElement, useEffect } from 'react';
import { withAdminLayout } from '@/components/Admin/withAdminLayout';
import { useNavigate } from '@/lib/router-compat';

/** Totals now live on Production Overview — keep this route as a redirect. */
function AccountProductionTotalsPage() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/account/production', { replace: true });
  }, [navigate]);
  return null;
}

AccountProductionTotalsPage.getLayout = (page: ReactElement) => withAdminLayout(page);

export default AccountProductionTotalsPage;
