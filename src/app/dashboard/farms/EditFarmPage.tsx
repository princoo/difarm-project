import { useMemo } from 'react';
import { useNavigate, useParams } from '@/lib/router-compat';
import toast from 'react-hot-toast';
import { isLoggedIn } from '@/hooks/api/auth';
import { useGetFarmById, useUpdateFarm } from '@/hooks/api/farms';
import { isFarmAdmin, isSuperAdmin } from '@/utils/permissions';
import FarmProfileForm from '@/app/onboarding/FarmProfileForm';
import {
  buildFarmPayload,
  farmToOnboardingValues,
  type FarmOnboardingValues,
} from '@/app/onboarding/farmOnboardingSchema';

function unwrapFarm(payload: unknown): Record<string, any> | null {
  if (!payload || typeof payload !== 'object') return null;
  const body = payload as { data?: unknown };
  const data = body.data ?? payload;
  if (!data || typeof data !== 'object') return null;
  const farm = data as Record<string, any>;
  return farm.id ? farm : null;
}

export default function EditFarmPage() {
  const { farmId } = useParams<{ farmId: string }>();
  const navigate = useNavigate();
  const user = isLoggedIn();
  const superAdmin = isSuperAdmin(user?.role);
  const farmAdmin = isFarmAdmin(user?.role);
  const { farm: farmPayload, loading: farmLoading, error } = useGetFarmById(
    farmId ?? ''
  );
  const { updateFarm, loading: saving } = useUpdateFarm();

  const farm = useMemo(() => unwrapFarm(farmPayload), [farmPayload]);

  const initialValues = useMemo(
    () => (farm ? farmToOnboardingValues(farm) : undefined),
    [farm]
  );

  const canEdit =
    superAdmin ||
    farmAdmin;

  if (!user || !canEdit) {
    return (
      <div className="p-8 text-center text-gray-600">
        You do not have permission to edit this farm.
      </div>
    );
  }

  if (farmLoading || !farm || !initialValues) {
    return (
      <div className="p-8 text-center text-gray-500">
        {error ? 'Could not load farm.' : 'Loading farm profile…'}
      </div>
    );
  }

  const handleSubmit = async (
    values: FarmOnboardingValues,
    extras: { ownerId?: string }
  ) => {
    if (!farmId) return;
    try {
      const payload = buildFarmPayload(
        values,
        superAdmin ? extras.ownerId || farm.ownerId : undefined
      );
      // Don't send ownerId unless super admin is changing it via create flow;
      // edit keeps existing owner unless we add owner select for edit later.
      const { ownerId: _owner, ...rest } = payload as any;
      await updateFarm(farmId, rest);
      navigate(`/account/farms/${farmId}`, { replace: true });
    } catch {
      // toast from hook
    }
  };

  return (
    <FarmProfileForm
      key={farm.id}
      mode="edit"
      title="Edit farm profile"
      subtitle="Update the full farm profile using the same steps as registration."
      backLabel="Back to farm"
      onBack={() => navigate(`/account/farms/${farmId}`)}
      initialValues={initialValues}
      initialOwnerId={farm.ownerId ?? ''}
      showOwnerSelect={false}
      loading={saving}
      submitLabel="Save farm profile"
      onSubmit={handleSubmit}
    />
  );
}
