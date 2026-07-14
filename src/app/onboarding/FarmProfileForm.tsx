import '@/assets/css/farm-onboarding.css';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import {
  BuildingOffice2Icon,
  MapPinIcon,
  HomeModernIcon,
  UserGroupIcon,
  PhoneIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import Logo from '@/assets/logo.png';
import { imageSrc } from '@/lib/image-src';
import { InputField } from '@/components/input';
import { useFetchUsers } from '@/hooks/api/auth';
import {
  AFRICAN_COUNTRIES,
  loadRwandaHierarchy,
  type CountryOption,
} from '@/app/dashboard/farms/locationData';
import { LocationTypeahead } from '@/app/dashboard/farms/LocationTypeahead';
import {
  FARM_TYPES,
  LIVESTOCK_OPTIONS,
  VET_ACCESS_OPTIONS,
  WATER_SOURCES,
  ONBOARDING_STEPS,
  farmOnboardingSchema,
  type FarmOnboardingValues,
} from './farmOnboardingSchema';

const STEP_FIELDS: Record<number, (keyof FarmOnboardingValues)[]> = {
  1: ['name', 'type', 'registrationNo', 'yearEstablished', 'description'],
  2: ['locationText'],
  3: [
    'size',
    'grazingArea',
    'housingCapacity',
    'waterSource',
    'veterinaryAccess',
    'landmarks',
    'latitude',
    'longitude',
  ],
  4: ['primaryLivestock', 'breeds', 'herdSizeEstimate'],
  5: ['contactPhone', 'contactEmail', 'emergencyContact'],
};

const STEP_ICONS = [
  BuildingOffice2Icon,
  MapPinIcon,
  HomeModernIcon,
  UserGroupIcon,
  PhoneIcon,
];

export type FarmProfileFormProps = {
  mode: 'create' | 'edit';
  title: string;
  subtitle: string;
  backLabel: string;
  onBack: () => void;
  initialValues?: Partial<FarmOnboardingValues>;
  initialOwnerId?: string;
  showOwnerSelect?: boolean;
  loading?: boolean;
  submitLabel: string;
  onSubmit: (
    values: FarmOnboardingValues,
    extras: { ownerId?: string }
  ) => Promise<void>;
};

export default function FarmProfileForm({
  mode,
  title,
  subtitle,
  backLabel,
  onBack,
  initialValues,
  initialOwnerId = '',
  showOwnerSelect = false,
  loading = false,
  submitLabel,
  onSubmit,
}: FarmProfileFormProps) {
  const { users: allUsers, fetchUsers } = useFetchUsers();
  const [step, setStep] = useState(1);
  const [ownerId, setOwnerId] = useState(initialOwnerId);

  const [fullHierarchy, setFullHierarchy] = useState<CountryOption[]>([]);
  const [countryId, setCountryId] = useState('');
  const [provinceId, setProvinceId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [sectorId, setSectorId] = useState('');
  const [cellId, setCellId] = useState('');
  const [villageId, setVillageId] = useState('');

  const {
    register,
    watch,
    setValue,
    getValues,
    reset,
    trigger,
    formState: { errors },
  } = useForm<FarmOnboardingValues>({
    resolver: zodResolver(farmOnboardingSchema),
    shouldUnregister: false,
    defaultValues: {
      primaryLivestock: [],
      hasElectricity: false,
      contactEmail: '',
      contactPhone: '',
      ...initialValues,
    },
    mode: 'onBlur',
  });

  const livestock = watch('primaryLivestock') ?? [];
  const hasElectricity = watch('hasElectricity');
  const formValues = watch();

  useEffect(() => {
    if (showOwnerSelect) {
      fetchUsers({ role: 'ADMIN' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showOwnerSelect]);

  useEffect(() => {
    if (initialValues) {
      reset({
        primaryLivestock: [],
        hasElectricity: false,
        contactEmail: '',
        contactPhone: '',
        ...initialValues,
      });
    }
  }, [initialValues, reset]);

  useEffect(() => {
    setOwnerId(initialOwnerId);
  }, [initialOwnerId]);

  useEffect(() => {
    const initial = AFRICAN_COUNTRIES.map((c) => ({
      id: c.id,
      name: c.name,
      provinces: [],
    }));
    setFullHierarchy(initial);
    loadRwandaHierarchy()
      .then((rwanda) =>
        setFullHierarchy((prev) =>
          prev.map((c) => (c.id === 'rwanda' ? rwanda : c))
        )
      )
      .catch(() => {});
  }, []);

  const farmAdminOptions = useMemo(() => {
    const list = (allUsers as any)?.data?.data ?? [];
    if (!Array.isArray(list)) return [];
    return list.filter(
      (u: any) => u?.account?.role === 'ADMIN' || u?.role === 'ADMIN'
    );
  }, [allUsers]);

  const selectedCountry = fullHierarchy.find((c) => c.id === countryId);
  const selectedProvince = selectedCountry?.provinces.find(
    (p) => p.id === provinceId
  );
  const selectedDistrict = selectedProvince?.districts.find(
    (d) => d.id === districtId
  );
  const selectedSector = selectedDistrict?.sectors.find(
    (s) => s.id === sectorId
  );
  const selectedCell = selectedSector?.cells.find((c) => c.id === cellId);
  const selectedVillage = selectedCell?.villages.find(
    (v) => v.id === villageId
  );

  const locationString = useMemo(() => {
    const parts = [
      selectedCountry?.name,
      selectedProvince?.name,
      selectedDistrict?.name,
      selectedSector?.name,
      selectedCell?.name,
      selectedVillage?.name,
    ].filter(Boolean);
    return parts.join(' / ');
  }, [
    selectedCountry,
    selectedProvince,
    selectedDistrict,
    selectedSector,
    selectedCell,
    selectedVillage,
  ]);

  useEffect(() => {
    if (locationString) setValue('locationText', locationString);
  }, [locationString, setValue]);

  const toggleLivestock = (item: string) => {
    const next = livestock.includes(item)
      ? livestock.filter((x) => x !== item)
      : [...livestock, item];
    setValue('primaryLivestock', next, { shouldValidate: true });
  };

  const goNext = async () => {
    const fields = STEP_FIELDS[step];
    const valid = await trigger(fields);
    if (step === 2) {
      const loc = locationString.trim() || String(getValues('locationText') || '').trim();
      if (!loc) {
        toast.error(
          'Please select your farm location (at least country and province), or keep the existing address.'
        );
        return;
      }
    }
    if (valid) setStep((s) => Math.min(s + 1, ONBOARDING_STEPS.length));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleFinalSubmit = async () => {
    if (locationString) {
      setValue('locationText', locationString, { shouldValidate: true });
    }
    const values = getValues();
    const parsed = farmOnboardingSchema.safeParse({
      ...values,
      locationText: values.locationText || locationString,
    });
    if (!parsed.success) {
      const first = parsed.error.errors[0];
      toast.error(first?.message ?? 'Please complete all required fields.');
      const field = first?.path?.[0];
      if (typeof field === 'string') {
        const stepForField = Object.entries(STEP_FIELDS).find(([, fields]) =>
          fields.includes(field as keyof FarmOnboardingValues)
        );
        if (stepForField) setStep(Number(stepForField[0]));
      }
      return;
    }
    await onSubmit(parsed.data, {
      ownerId: showOwnerSelect ? ownerId || undefined : undefined,
    });
  };

  return (
    <div className="farm-onboarding min-h-screen bg-gradient-to-br from-[#f0faf9] via-white to-[#e8f5f4] dark:from-[#0a0f0f] dark:via-[#111] dark:to-[#0d1514] font-outfit">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          {backLabel}
        </button>

        <header className="text-center mb-8">
          <img
            src={imageSrc(Logo)}
            alt="DI-FARM"
            className="h-16 mx-auto mb-4"
          />
          <h1 className="text-2xl md:text-3xl font-bold text-primary">{title}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-lg mx-auto text-sm md:text-base">
            {subtitle}
          </p>
        </header>

        <nav
          className="farm-onboarding-steps mb-8"
          aria-label="Form progress"
        >
          {ONBOARDING_STEPS.map((s, i) => {
            const Icon = STEP_ICONS[i];
            const active = step === s.id;
            const done = step > s.id;
            return (
              <div
                key={s.id}
                className={`farm-onboarding-step ${active ? 'is-active' : ''} ${
                  done ? 'is-done' : ''
                }`}
              >
                <div className="farm-onboarding-step-icon">
                  {done ? (
                    <CheckCircleIcon className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-semibold">{s.title}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    {s.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </nav>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (step === ONBOARDING_STEPS.length) {
              void handleFinalSubmit();
            }
          }}
          className="farm-onboarding-card panel p-6 md:p-8"
        >
          {step === 1 && (
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <BuildingOffice2Icon className="w-6 h-6 text-primary" />
                Farm identity
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <InputField
                  label="Farm name *"
                  placeholder="e.g. Green Valley Dairy"
                  registration={register('name')}
                  error={errors.name?.message}
                  name="name"
                />
                <InputField
                  label="Registration / license no."
                  placeholder="Optional business registration"
                  registration={register('registrationNo')}
                  name="registrationNo"
                />
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Farm type *
                  </label>
                  <select {...register('type')} className="form-select w-full">
                    <option value="">Select type</option>
                    {FARM_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  {errors.type && (
                    <p className="text-xs text-danger mt-1">
                      {errors.type.message}
                    </p>
                  )}
                </div>
                <InputField
                  label="Year established"
                  placeholder="e.g. 2018"
                  registration={register('yearEstablished')}
                  name="yearEstablished"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                  About the farm
                </label>
                <textarea
                  {...register('description')}
                  rows={4}
                  placeholder="Describe your farm operations, mission, and main activities..."
                  className="form-textarea w-full rounded-lg border border-gray-300 dark:border-gray-600"
                />
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <MapPinIcon className="w-6 h-6 text-primary" />
                Location
              </h2>
              {mode === 'edit' && formValues.locationText && !locationString && (
                <p className="text-sm rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-gray-700 dark:text-gray-300">
                  Current address: <strong>{formValues.locationText}</strong>
                  . Re-select hierarchy below to replace it, or keep as-is.
                </p>
              )}
              <p className="text-sm text-gray-500">
                Select country through village (Rwanda has full hierarchy).
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-0.5 block">
                    Country
                  </label>
                  <select
                    value={countryId}
                    onChange={(e) => {
                      setCountryId(e.target.value);
                      setProvinceId('');
                      setDistrictId('');
                      setSectorId('');
                      setCellId('');
                      setVillageId('');
                    }}
                    className="form-select w-full text-sm"
                  >
                    <option value="">Select country</option>
                    {fullHierarchy.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-0.5 block">
                    Province
                  </label>
                  <LocationTypeahead
                    options={selectedCountry?.provinces ?? []}
                    value={provinceId}
                    onChange={(id) => {
                      setProvinceId(id);
                      setDistrictId('');
                      setSectorId('');
                      setCellId('');
                      setVillageId('');
                    }}
                    placeholder="Province"
                    disabled={!selectedCountry}
                    className="form-input w-full text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-0.5 block">
                    District
                  </label>
                  <LocationTypeahead
                    options={selectedProvince?.districts ?? []}
                    value={districtId}
                    onChange={(id) => {
                      setDistrictId(id);
                      setSectorId('');
                      setCellId('');
                      setVillageId('');
                    }}
                    placeholder="District"
                    disabled={!selectedProvince}
                    className="form-input w-full text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-0.5 block">
                    Sector
                  </label>
                  <LocationTypeahead
                    options={selectedDistrict?.sectors ?? []}
                    value={sectorId}
                    onChange={(id) => {
                      setSectorId(id);
                      setCellId('');
                      setVillageId('');
                    }}
                    placeholder="Sector"
                    disabled={!selectedDistrict}
                    className="form-input w-full text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-0.5 block">Cell</label>
                  <LocationTypeahead
                    options={selectedSector?.cells ?? []}
                    value={cellId}
                    onChange={(id) => {
                      setCellId(id);
                      setVillageId('');
                    }}
                    placeholder="Cell"
                    disabled={!selectedSector}
                    className="form-input w-full text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-0.5 block">
                    Village
                  </label>
                  <LocationTypeahead
                    options={selectedCell?.villages ?? []}
                    value={villageId}
                    onChange={setVillageId}
                    placeholder="Village"
                    disabled={!selectedCell}
                    className="form-input w-full text-sm"
                  />
                </div>
              </div>
              {locationString && (
                <p className="text-sm text-primary font-medium">
                  Selected: {locationString}
                </p>
              )}
              <input type="hidden" {...register('locationText')} />
              {errors.locationText && (
                <p className="text-xs text-danger">
                  {errors.locationText.message}
                </p>
              )}
              <InputField
                label="Landmarks / directions"
                placeholder="Near main road, opposite school..."
                registration={register('landmarks')}
                name="landmarks"
              />
              <div className="grid md:grid-cols-2 gap-4">
                <InputField
                  label="Latitude (optional)"
                  placeholder="-1.9441"
                  registration={register('latitude')}
                  name="latitude"
                />
                <InputField
                  label="Longitude (optional)"
                  placeholder="30.0619"
                  registration={register('longitude')}
                  name="longitude"
                />
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <HomeModernIcon className="w-6 h-6 text-primary" />
                Land & facilities
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <InputField
                  label="Total land size (sqm) *"
                  placeholder="e.g. 5000"
                  registration={register('size')}
                  error={errors.size?.message}
                  name="size"
                />
                <InputField
                  label="Grazing area (sqm)"
                  placeholder="Pasture / grazing land"
                  registration={register('grazingArea')}
                  name="grazingArea"
                />
                <InputField
                  label="Housing capacity (animals)"
                  placeholder="Max animals in sheds"
                  registration={register('housingCapacity')}
                  name="housingCapacity"
                />
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Water source
                  </label>
                  <select
                    {...register('waterSource')}
                    className="form-select w-full"
                  >
                    <option value="">Select</option>
                    {WATER_SOURCES.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Veterinary access
                  </label>
                  <select
                    {...register('veterinaryAccess')}
                    className="form-select w-full"
                  >
                    <option value="">Select</option>
                    {VET_ACCESS_OPTIONS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <input
                    type="checkbox"
                    id="hasElectricity"
                    {...register('hasElectricity')}
                    checked={!!hasElectricity}
                    className="form-checkbox text-primary"
                  />
                  <label htmlFor="hasElectricity" className="text-sm font-medium">
                    Electricity on farm
                  </label>
                </div>
              </div>
            </section>
          )}

          {step === 4 && (
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <UserGroupIcon className="w-6 h-6 text-primary" />
                Livestock profile
              </h2>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Primary livestock *
                </label>
                <div className="flex flex-wrap gap-2">
                  {LIVESTOCK_OPTIONS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleLivestock(item)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        livestock.includes(item)
                          ? 'bg-primary text-white border-primary'
                          : 'border-gray-300 dark:border-gray-600 hover:border-primary'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                {errors.primaryLivestock && (
                  <p className="text-xs text-danger mt-1">
                    {errors.primaryLivestock.message}
                  </p>
                )}
              </div>
              <InputField
                label="Main breeds kept"
                placeholder="e.g. Friesian, Ankole, Crossbreed"
                registration={register('breeds')}
                name="breeds"
              />
              <InputField
                label="Estimated herd size"
                placeholder="Total animals on farm"
                registration={register('herdSizeEstimate')}
                name="herdSizeEstimate"
              />
            </section>
          )}

          {step === 5 && (
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <PhoneIcon className="w-6 h-6 text-primary" />
                Contact & review
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <InputField
                  label="Farm phone *"
                  placeholder="+250..."
                  registration={register('contactPhone')}
                  error={errors.contactPhone?.message}
                  name="contactPhone"
                />
                <InputField
                  label="Farm email"
                  type="email"
                  placeholder="farm@email.com"
                  registration={register('contactEmail')}
                  error={errors.contactEmail?.message}
                  name="contactEmail"
                />
                <InputField
                  label="Emergency contact"
                  placeholder="Name & phone"
                  registration={register('emergencyContact')}
                  name="emergencyContact"
                />
              </div>

              {showOwnerSelect && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Owner (Farm Admin) — optional
                  </label>
                  <select
                    value={ownerId}
                    onChange={(e) => setOwnerId(e.target.value)}
                    className="form-select w-full"
                  >
                    <option value="">No owner yet (assign later)</option>
                    {farmAdminOptions.map((u: any) => (
                      <option key={u.id} value={u.id}>
                        {u.fullname ||
                          u.account?.username ||
                          u.account?.email ||
                          u.id}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Leave empty to create an unassigned farm, then assign when
                    adding a farm admin.
                  </p>
                </div>
              )}

              <div className="rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 p-4 text-sm space-y-2">
                <p className="font-semibold text-gray-800 dark:text-white">
                  Profile summary
                </p>
                <p>
                  <span className="text-gray-500">Farm:</span>{' '}
                  {formValues.name || '—'} ({formValues.type || '—'})
                </p>
                <p>
                  <span className="text-gray-500">Location:</span>{' '}
                  {formValues.locationText || locationString || '—'}
                </p>
                <p>
                  <span className="text-gray-500">Size:</span>{' '}
                  {formValues.size ? `${formValues.size} sqm` : '—'}
                </p>
                <p>
                  <span className="text-gray-500">Livestock:</span>{' '}
                  {livestock.join(', ') || '—'}
                </p>
              </div>
            </section>
          )}

          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 1}
              className="btn btn-outline-primary inline-flex items-center gap-1 disabled:opacity-40"
            >
              <ChevronLeftIcon className="w-4 h-4" /> Back
            </button>
            {step < ONBOARDING_STEPS.length ? (
              <button
                type="button"
                onClick={goNext}
                className="btn btn-primary inline-flex items-center gap-1"
              >
                Next <ChevronRightIcon className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleFinalSubmit()}
                disabled={loading}
                className="btn btn-primary px-8"
              >
                {loading ? 'Saving…' : submitLabel}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
