import { useEffect, useMemo, useState } from 'react';
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
import { buildAgricultureFarmPayload, type AgricultureOnboardingValues } from './agricultureOnboardingSchema';
import FarmProfileForm from './FarmProfileForm';
import AgricultureFarmProfileForm from './AgricultureFarmProfileForm';

export type FarmRegistrationCategory = 'LIVESTOCK' | 'AGRICULTURE';

function resolveDefaultCategory(farmingMode?: string): FarmRegistrationCategory | null {
  if (farmingMode === 'AGRICULTURE') return 'AGRICULTURE';
  if (farmingMode === 'LIVESTOCK') return 'LIVESTOCK';
  return null;
}

export default function RegisterFarmPage() {
  const navigate = useNavigate();
  const user = isLoggedIn();
  const superAdmin = isSuperAdmin(user?.role);
  const farmAdmin = isFarmAdmin(user?.role);
  const { addFarm, loading } = useAddFarm();
  const [category, setCategory] = useState<FarmRegistrationCategory | null>(
    () => resolveDefaultCategory(user?.farmingMode)
  );

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (!farmAdmin && !superAdmin) {
      navigate('/choose-farm', { replace: true });
    }
  }, [user, farmAdmin, superAdmin, navigate]);

  const showCategoryPicker = useMemo(() => {
    if (superAdmin) return category == null;
    return user?.farmingMode === 'HYBRID' && category == null;
  }, [superAdmin, user?.farmingMode, category]);

  if (!user) return null;

  const handleLivestockSubmit = async (
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
      await addFarm(buildFarmPayload(values, resolvedOwnerId));
      afterSuccess();
    } catch {
      // addFarm shows toast
    }
  };

  const handleAgricultureSubmit = async (values: AgricultureOnboardingValues) => {
    try {
      const resolvedOwnerId = superAdmin ? undefined : (user?.userId ?? user?.id);
      if (!superAdmin && !resolvedOwnerId) {
        toast.error('Session expired. Please log in again.');
        navigate('/login', { replace: true });
        return;
      }
      await addFarm(buildAgricultureFarmPayload(values, resolvedOwnerId));
      afterSuccess();
    } catch {
      // addFarm shows toast
    }
  };

  const afterSuccess = () => {
    if (superAdmin) {
      toast.success('Farm created successfully.');
      navigate('/account/farms', { replace: true });
    } else {
      clearFarmId();
      toast.success('Farm profile submitted! Waiting for super admin activation.');
      navigate('/choose-farm', { replace: true });
    }
  };

  const onBack = () =>
    navigate(superAdmin ? '/account/farms' : '/choose-farm');

  if (showCategoryPicker) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f0faf9] via-white to-[#e8f5f4] font-outfit flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-primary mb-2">Register a farm</h1>
          <p className="text-gray-600 text-sm mb-8">What type of farm are you registering?</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setCategory('LIVESTOCK')}
              className="rounded-xl border-2 border-green-700/30 p-6 hover:border-green-700 hover:bg-green-50 transition"
            >
              <span className="text-3xl">🐄</span>
              <p className="font-semibold mt-2">Livestock farm</p>
              <p className="text-xs text-gray-500 mt-1">Cattle, goats, health & production</p>
            </button>
            <button
              type="button"
              onClick={() => setCategory('AGRICULTURE')}
              className="rounded-xl border-2 border-green-700/30 p-6 hover:border-green-700 hover:bg-green-50 transition"
            >
              <span className="text-3xl">🌾</span>
              <p className="font-semibold mt-2">Agriculture farm</p>
              <p className="text-xs text-gray-500 mt-1">Crops, fields, plantings & harvests</p>
            </button>
          </div>
          <button type="button" onClick={onBack} className="mt-6 text-sm text-primary hover:underline">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const activeCategory = category ?? resolveDefaultCategory(user?.farmingMode) ?? 'LIVESTOCK';

  if (activeCategory === 'AGRICULTURE') {
    return (
      <AgricultureFarmProfileForm
        title={superAdmin ? 'Register an agriculture farm' : 'Register your agriculture farm'}
        subtitle="Complete all sections to build your crop farm profile."
        backLabel={superAdmin ? 'Back to Farms' : 'Back to farm selection'}
        onBack={() => {
          if (superAdmin || user?.farmingMode === 'HYBRID') setCategory(null);
          else onBack();
        }}
        initialValues={{
          primaryCrops: [],
          hasElectricity: false,
          contactEmail: user?.email ?? '',
          contactPhone: user?.phone ?? '',
        }}
        loading={loading}
        submitLabel={superAdmin ? 'Create farm' : 'Submit farm profile'}
        onSubmit={handleAgricultureSubmit}
      />
    );
  }

  return (
    <FarmProfileForm
      mode="create"
      title={superAdmin ? 'Register a livestock farm' : 'Register your livestock farm'}
      subtitle={
        superAdmin
          ? 'Complete the full farm profile. The farm is activated immediately.'
          : 'Complete all sections to build your livestock farm profile.'
      }
      backLabel={superAdmin ? 'Back to Farms' : 'Back to farm selection'}
      onBack={() => {
        if (superAdmin || user?.farmingMode === 'HYBRID') setCategory(null);
        else onBack();
      }}
      initialValues={{
        primaryLivestock: [],
        hasElectricity: false,
        contactEmail: user?.email ?? '',
        contactPhone: user?.phone ?? '',
      }}
      showOwnerSelect={superAdmin}
      loading={loading}
      submitLabel={superAdmin ? 'Create farm' : 'Submit farm profile'}
      onSubmit={handleLivestockSubmit}
    />
  );
}
