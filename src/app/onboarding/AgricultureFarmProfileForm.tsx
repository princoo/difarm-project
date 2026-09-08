import '@/assets/css/farm-onboarding.css';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import {
  BuildingOffice2Icon,
  MapPinIcon,
  HomeModernIcon,
  SparklesIcon,
  PhoneIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import Logo from '@/assets/landing/logo-nav-transparent.png';
import { imageSrc } from '@/lib/image-src';
import { InputField } from '@/components/input';
import {
  AFRICAN_COUNTRIES,
  loadRwandaHierarchy,
  type CountryOption,
} from '@/app/dashboard/farms/locationData';
import { LocationTypeahead } from '@/app/dashboard/farms/LocationTypeahead';
import {
  AGRICULTURE_FARM_TYPES,
  CROP_OPTIONS,
  IRRIGATION_TYPES,
  SOIL_TYPES,
  AG_ONBOARDING_STEPS,
  agricultureOnboardingSchema,
  type AgricultureOnboardingValues,
} from './agricultureOnboardingSchema';
import { WATER_SOURCES } from './farmOnboardingSchema';

const STEP_FIELDS: Record<number, (keyof AgricultureOnboardingValues)[]> = {
  1: ['name', 'type', 'registrationNo', 'yearEstablished', 'description'],
  2: ['locationText'],
  3: ['size', 'cultivatedArea', 'waterSource', 'irrigationType', 'soilType', 'landmarks'],
  4: ['primaryCrops', 'fieldCountEstimate'],
  5: ['contactPhone', 'contactEmail', 'emergencyContact'],
};

const STEP_ICONS = [BuildingOffice2Icon, MapPinIcon, HomeModernIcon, SparklesIcon, PhoneIcon];

export type AgricultureFarmProfileFormProps = {
  title: string;
  subtitle: string;
  backLabel: string;
  onBack: () => void;
  initialValues?: Partial<AgricultureOnboardingValues>;
  loading?: boolean;
  submitLabel: string;
  onSubmit: (values: AgricultureOnboardingValues) => Promise<void>;
};

export default function AgricultureFarmProfileForm({
  title,
  subtitle,
  backLabel,
  onBack,
  initialValues,
  loading = false,
  submitLabel,
  onSubmit,
}: AgricultureFarmProfileFormProps) {
  const [step, setStep] = useState(1);
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
    trigger,
    formState: { errors },
  } = useForm<AgricultureOnboardingValues>({
    resolver: zodResolver(agricultureOnboardingSchema),
    defaultValues: {
      primaryCrops: [],
      hasElectricity: false,
      contactEmail: '',
      contactPhone: '',
      ...initialValues,
    },
  });

  const crops = watch('primaryCrops') ?? [];
  const hasElectricity = watch('hasElectricity');

  useEffect(() => {
    const initial = AFRICAN_COUNTRIES.map((c) => ({ id: c.id, name: c.name, provinces: [] }));
    setFullHierarchy(initial);
    loadRwandaHierarchy()
      .then((rwanda) => setFullHierarchy((prev) => prev.map((c) => (c.id === 'rwanda' ? rwanda : c))))
      .catch(() => {});
  }, []);

  const selectedCountry = fullHierarchy.find((c) => c.id === countryId);
  const selectedProvince = selectedCountry?.provinces.find((p) => p.id === provinceId);
  const selectedDistrict = selectedProvince?.districts.find((d) => d.id === districtId);
  const selectedSector = selectedDistrict?.sectors.find((s) => s.id === sectorId);
  const selectedCell = selectedSector?.cells.find((c) => c.id === cellId);
  const selectedVillage = selectedCell?.villages.find((v) => v.id === villageId);

  const locationString = useMemo(() => {
    return [
      selectedCountry?.name,
      selectedProvince?.name,
      selectedDistrict?.name,
      selectedSector?.name,
      selectedCell?.name,
      selectedVillage?.name,
    ]
      .filter(Boolean)
      .join(' / ');
  }, [selectedCountry, selectedProvince, selectedDistrict, selectedSector, selectedCell, selectedVillage]);

  useEffect(() => {
    if (locationString) setValue('locationText', locationString);
  }, [locationString, setValue]);

  const toggleCrop = (item: string) => {
    const next = crops.includes(item) ? crops.filter((x) => x !== item) : [...crops, item];
    setValue('primaryCrops', next, { shouldValidate: true });
  };

  const goNext = async () => {
    const valid = await trigger(STEP_FIELDS[step]);
    if (step === 2 && !locationString.trim() && !getValues('locationText')?.trim()) {
      toast.error('Please select your farm location.');
      return;
    }
    if (valid) setStep((s) => Math.min(s + 1, AG_ONBOARDING_STEPS.length));
  };

  const handleFinalSubmit = async () => {
    const values = getValues();
    const parsed = agricultureOnboardingSchema.safeParse({
      ...values,
      locationText: values.locationText || locationString,
    });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? 'Please complete all required fields.');
      return;
    }
    await onSubmit(parsed.data);
  };

  return (
    <div className="farm-onboarding min-h-screen bg-gradient-to-br from-[#f0faf9] via-white to-[#e8f5f4] font-outfit">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button type="button" onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          <ArrowLeftIcon className="w-4 h-4" />
          {backLabel}
        </button>
        <header className="text-center mb-8">
          <img src={imageSrc(Logo)} alt="DiFarm" className="mx-auto mb-4 h-14 w-auto object-contain" />
          <h1 className="text-2xl md:text-3xl font-bold text-primary">{title}</h1>
          <p className="text-gray-600 mt-2 max-w-lg mx-auto text-sm">{subtitle}</p>
        </header>

        <nav className="farm-onboarding-steps mb-8">
          {AG_ONBOARDING_STEPS.map((s, i) => {
            const Icon = STEP_ICONS[i];
            return (
              <div key={s.id} className={`farm-onboarding-step ${step === s.id ? 'is-active' : ''} ${step > s.id ? 'is-done' : ''}`}>
                <div className="farm-onboarding-step-icon">
                  {step > s.id ? <CheckCircleIcon className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-semibold">{s.title}</p>
                  <p className="text-[10px] text-gray-500">{s.subtitle}</p>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          {step === 1 && (
            <div className="space-y-4">
              <InputField label="Farm name *" name="name" registration={register('name')} error={errors.name?.message} />
              <div>
                <label className="block text-sm font-medium mb-1">Farm type *</label>
                <select {...register('type')} className="form-input w-full">
                  <option value="">Select type</option>
                  {AGRICULTURE_FARM_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>}
              </div>
              <InputField label="Registration number" name="registrationNo" registration={register('registrationNo')} />
              <InputField label="Year established" type="number" name="yearEstablished" registration={register('yearEstablished')} />
              <InputField label="Description" name="description" registration={register('description')} />
            </div>
          )}

          {step === 2 && (
            <section className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <MapPinIcon className="w-6 h-6 text-primary" />
                Location
              </h2>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-0.5 block">Country</label>
                  <select value={countryId} onChange={(e) => { setCountryId(e.target.value); setProvinceId(''); setDistrictId(''); setSectorId(''); setCellId(''); setVillageId(''); }} className="form-select w-full text-sm">
                    <option value="">Select country</option>
                    {fullHierarchy.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-0.5 block">Province</label>
                  <LocationTypeahead options={selectedCountry?.provinces ?? []} value={provinceId} onChange={(id) => { setProvinceId(id); setDistrictId(''); setSectorId(''); setCellId(''); setVillageId(''); }} placeholder="Province" disabled={!selectedCountry} className="form-input w-full text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-0.5 block">District</label>
                  <LocationTypeahead options={selectedProvince?.districts ?? []} value={districtId} onChange={(id) => { setDistrictId(id); setSectorId(''); setCellId(''); setVillageId(''); }} placeholder="District" disabled={!selectedProvince} className="form-input w-full text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-0.5 block">Sector</label>
                  <LocationTypeahead options={selectedDistrict?.sectors ?? []} value={sectorId} onChange={(id) => { setSectorId(id); setCellId(''); setVillageId(''); }} placeholder="Sector" disabled={!selectedDistrict} className="form-input w-full text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-0.5 block">Cell</label>
                  <LocationTypeahead options={selectedSector?.cells ?? []} value={cellId} onChange={(id) => { setCellId(id); setVillageId(''); }} placeholder="Cell" disabled={!selectedSector} className="form-input w-full text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-0.5 block">Village</label>
                  <LocationTypeahead options={selectedCell?.villages ?? []} value={villageId} onChange={setVillageId} placeholder="Village" disabled={!selectedCell} className="form-input w-full text-sm" />
                </div>
              </div>
              {locationString && <p className="text-sm text-primary font-medium">Selected: {locationString}</p>}
            </section>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <InputField label="Total land size (hectares) *" type="number" step="0.01" name="size" registration={register('size')} error={errors.size?.message} />
              <InputField label="Cultivated area (hectares)" type="number" step="0.01" name="cultivatedArea" registration={register('cultivatedArea')} />
              <div>
                <label className="block text-sm font-medium mb-1">Water source</label>
                <select {...register('waterSource')} className="form-input w-full">
                  <option value="">Select</option>
                  {WATER_SOURCES.map((w) => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Irrigation type</label>
                <select {...register('irrigationType')} className="form-input w-full">
                  <option value="">Select</option>
                  {IRRIGATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Soil type</label>
                <select {...register('soilType')} className="form-input w-full">
                  <option value="">Select</option>
                  {SOIL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={!!hasElectricity} onChange={(e) => setValue('hasElectricity', e.target.checked)} />
                <span className="text-sm">Electricity on farm</span>
              </label>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Select primary crops *</p>
              <div className="flex flex-wrap gap-2">
                {CROP_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCrop(c)}
                    className={`px-3 py-1.5 rounded-full text-sm border ${crops.includes(c) ? 'bg-green-700 text-white border-green-700' : 'border-gray-300'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              {errors.primaryCrops && <p className="text-red-500 text-xs">{errors.primaryCrops.message}</p>}
              <InputField label="Estimated number of fields/beds" type="number" name="fieldCountEstimate" registration={register('fieldCountEstimate')} />
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <InputField label="Contact phone *" name="contactPhone" registration={register('contactPhone')} error={errors.contactPhone?.message} />
              <InputField label="Contact email" type="email" name="contactEmail" registration={register('contactEmail')} />
              <InputField label="Emergency contact" name="emergencyContact" registration={register('emergencyContact')} />
              <div className="rounded-lg bg-gray-50 p-4 text-sm space-y-1">
                <p><strong>Name:</strong> {getValues('name')}</p>
                <p><strong>Type:</strong> {getValues('type')}</p>
                <p><strong>Location:</strong> {getValues('locationText') || locationString}</p>
                <p><strong>Crops:</strong> {crops.join(', ')}</p>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8 pt-6 border-t">
            {step > 1 ? (
              <button type="button" onClick={() => setStep((s) => s - 1)} className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700">
                <ChevronLeftIcon className="w-4 h-4" /> Back
              </button>
            ) : <span />}
            {step < AG_ONBOARDING_STEPS.length ? (
              <button type="button" onClick={goNext} className="inline-flex items-center gap-1 px-6 py-2.5 bg-green-700 text-white rounded-lg text-sm font-medium">
                Next <ChevronRightIcon className="w-4 h-4" />
              </button>
            ) : (
              <button type="button" disabled={loading} onClick={handleFinalSubmit} className="px-6 py-2.5 bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-60">
                {loading ? 'Submitting…' : submitLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
