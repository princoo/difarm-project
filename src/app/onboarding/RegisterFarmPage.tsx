import { useEffect } from 'react';
import { useNavigate } from '@/lib/router-compat';
import toast from 'react-hot-toast';
import { isLoggedIn } from '@/hooks/api/auth';
import useAddFarm from '@/hooks/api/farms';
import { isFarmAdmin, isSuperAdmin } from '@/utils/permissions';
import { clearFarmId } from '@/utils/farmId';
import {
  buildFarmPayload,
  type FarmOnboardingValues,
} from './farmOnboardingSchema';
import FarmProfileForm from './FarmProfileForm';

export default function RegisterFarmPage() {
  const navigate = useNavigate();
  const user = isLoggedIn();
  const superAdmin = isSuperAdmin(user?.role);
  const farmAdmin = isFarmAdmin(user?.role);
  const { addFarm, loading } = useAddFarm();

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (!farmAdmin && !superAdmin) {
      navigate('/choose-farm', { replace: true });
    }
  }, [user, farmAdmin, superAdmin, navigate]);

  if (!user) return null;

  const handleSubmit = async (
    values: FarmOnboardingValues,
    extras: { ownerId?: string }
  ) => {
    try {
      let resolvedOwnerId: string | undefined;
      if (superAdmin) {
        resolvedOwnerId = extras.ownerId;
      } else {
        resolvedOwnerId = user?.userId ?? user?.id;
        if (!resolvedOwnerId) {
          toast.error('Session expired. Please log in again.');
          navigate('/login', { replace: true });
          return;
        }
      }

      const payload = buildFarmPayload(values, resolvedOwnerId);
      await addFarm(payload);

      if (superAdmin) {
        toast.success('Farm created successfully.');
        navigate('/account/farms', { replace: true });
      } else {
        clearFarmId();
        toast.success(
          'Farm profile submitted! Waiting for super admin activation.'
        );
        navigate('/choose-farm', { replace: true });
      }
    } catch {
      // addFarm shows toast
    }
  };

  return (
    <FarmProfileForm
      mode="create"
      title={
        superAdmin ? 'Register a new farm' : 'Register your first farm'
      }
      subtitle={
        superAdmin
          ? 'Complete the full farm profile. The farm is activated immediately. You can assign a farm admin now or later.'
          : 'Complete all sections to build your full farm profile. Your farm will be reviewed and activated by a super admin.'
      }
      backLabel={superAdmin ? 'Back to Farms' : 'Back to farm selection'}
      onBack={() =>
        navigate(superAdmin ? '/account/farms' : '/choose-farm')
      }
      initialValues={{
        primaryLivestock: [],
        hasElectricity: false,
        contactEmail: user?.email ?? '',
        contactPhone: user?.phone ?? '',
      }}
      showOwnerSelect={superAdmin}
      loading={loading}
      submitLabel={superAdmin ? 'Create farm' : 'Submit farm profile'}
      onSubmit={handleSubmit}
    />
  );
}
