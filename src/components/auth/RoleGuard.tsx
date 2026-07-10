import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from '@/lib/router-compat';
import { isLoggedIn } from '@/hooks/api/auth';
import { canAccessRoute, FARM_OPTIONAL_PATHS } from '@/utils/permissions';
import { getFarmId } from '@/utils/farmId';

type RoleGuardProps = {
  children: ReactNode;
  allowedRoles?: string[];
};

/**
 * Protects dashboard routes: requires login, optional role list, and farm selection.
 */
export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = isLoggedIn();

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    if (allowedRoles?.length && !allowedRoles.includes(user.role)) {
      navigate('/account', { replace: true });
      return;
    }

    if (!canAccessRoute(location.pathname, user.role)) {
      navigate('/account', { replace: true });
      return;
    }

    const farmOptional = FARM_OPTIONAL_PATHS.some((p) =>
      location.pathname.startsWith(p)
    );
    if (!farmOptional && !getFarmId() && user.role !== 'SUPERADMIN') {
      navigate('/choose-farm', { replace: true });
    }
  }, [user, location.pathname, allowedRoles, navigate]);

  if (!user) return null;

  return <>{children}</>;
}
