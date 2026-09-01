import { z } from 'zod';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { InputField } from '@/components/input';
import AppSelect from '@/components/select/SelectField';
import { useMedicines } from '@/hooks/api/medicine';
import { useCattle } from '@/hooks/api/cattle';
import { useLivestock } from '@/hooks/api/livestock';
import { useSelectedFarmId } from '@/hooks/useSelectedFarmId';
import {
  ANIMAL_TYPE_OPTIONS,
  ANIMAL_TYPE_VALUES,
  animalPayloadKey,
  animalTypeLabel,
  animalTypeOf,
  buildAnimalOptions,
} from '../health/animalRef';

const unitLabel = (unit?: string) =>
  unit === 'LITERS' ? 'L' : unit === 'PIECES' ? 'pcs' : 'g';

const schema = z.object({
  medicineId: z.string().min(1, 'Select a medicine'),
  animalType: z.enum(ANIMAL_TYPE_VALUES),
  animalId: z.string().min(1, 'Select the animal'),
  quantity: z.number().gt(0, 'Quantity must be greater than 0'),
  diseaseName: z.string().min(1, 'Disease is required'),
  date: z.string().min(1, 'Date is required'),
  toolId: z.string().optional().or(z.literal('')),
  toolQuantity: z.number().gt(0).optional(),
});

type FormValues = z.infer<typeof schema>;

const UpdateMedicineUsageModal = ({
  isOpen,
  onClose,
  usage,
  handleRefetch,
  medicinesList = [],
}: {
  isOpen: boolean;
  onClose: () => void;
  usage: any;
  handleRefetch: () => void;
  medicinesList?: any[];
}) => {
  const { updateUsage, loading } = useMedicines();
  const { cattle, fetchCattleOnSelectedFarm }: any = useCattle();
  const { allLivestock, fetchLivestockOnSelectedFarm } = useLivestock();
  const selectedFarmId = useSelectedFarmId(isOpen);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const selectedToolId = useWatch({ control, name: 'toolId' });
  const recordType = animalTypeOf(usage);
  const animalType = useWatch({ control, name: 'animalType' }) ?? recordType;

  useEffect(() => {
    if (!isOpen || !selectedFarmId) return;
    fetchCattleOnSelectedFarm('pageSize=500');
    fetchLivestockOnSelectedFarm();
  }, [isOpen, selectedFarmId]);

  // Switching type invalidates the previously selected tag.
  useEffect(() => {
    if (animalType && animalType !== recordType) {
      setValue('animalId', '');
    }
  }, [animalType, recordType, setValue]);

  useEffect(() => {
    if (!isOpen || !usage) return;
    reset({
      medicineId: usage.medicineId || usage.medicine?.id || '',
      animalType: recordType,
      animalId:
        recordType === 'CATTLE'
          ? usage.cattleId || usage.cattle?.id || ''
          : usage.livestockId || usage.livestock?.id || '',
      quantity: Number(usage.quantity) || 0,
      diseaseName: usage.diseaseName || '',
      date: usage.date ? String(usage.date).slice(0, 10) : '',
      toolId: usage.toolId || usage.tool?.id || '',
      toolQuantity: usage.toolQuantity != null ? Number(usage.toolQuantity) : 1,
    });
  }, [isOpen, usage, reset]);

  const medicineOptions = useMemo(
    () =>
      medicinesList
        .filter((m) => (m.itemType ?? 'MEDICINE') !== 'TOOL')
        .map((m) => ({
          value: m.id,
          label: `${m.name} (${Number(m.quantity).toLocaleString()} ${unitLabel(
            m.unit
          )} left)`,
        })),
    [medicinesList]
  );

  const toolOptions = useMemo(
    () => [
      { value: '', label: 'No tool used' },
      ...medicinesList
        .filter((m) => m.itemType === 'TOOL')
        .map((m) => ({
          value: m.id,
          label: `${m.name} (${Number(m.quantity).toLocaleString()} ${unitLabel(
            m.unit
          )} left)`,
        })),
    ],
    [medicinesList]
  );

  const animalOptions = buildAnimalOptions(
    animalType,
    cattle?.data?.data,
    allLivestock?.data?.data
  );

  const typeDefaultValue = useMemo(
    () => ANIMAL_TYPE_OPTIONS.find((o) => o.value === recordType),
    [recordType]
  );

  // Only prefill the picker while the form still points at the record's type.
  const animalDefaultValue = useMemo(() => {
    if (animalType !== recordType) return undefined;
    if (recordType === 'CATTLE') {
      return usage?.cattle
        ? { value: usage.cattle.id, label: String(usage.cattle.tagNumber) }
        : undefined;
    }
    return usage?.livestock
      ? {
          value: usage.livestock.id,
          label: String(usage.livestock.tagNumber),
        }
      : undefined;
  }, [animalType, recordType, usage]);

  const onSubmit = async (data: FormValues) => {
    try {
      await updateUsage(usage.id, {
        medicineId: data.medicineId,
        [animalPayloadKey(data.animalType)]: data.animalId,
        quantity: data.quantity,
        diseaseName: data.diseaseName,
        date: data.date,
        toolId: data.toolId || null,
        toolQuantity: data.toolId ? data.toolQuantity ?? 1 : null,
      });
      onClose();
      handleRefetch();
    } catch {
      /* toast shown */
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" open={isOpen} onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0" />
        </Transition.Child>
        <div className="fixed inset-0 bg-[black]/60 z-[999] overflow-y-auto">
          <div className="flex items-start justify-center min-h-screen px-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md p-6 mt-8 mb-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded dark:bg-gray-900">
                <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white">
                  Edit medicine usage
                </Dialog.Title>
                <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3">
                  <AppSelect
                    label="Medicine"
                    name="medicineId"
                    placeholder="Select medicine"
                    options={medicineOptions}
                    defaultValue={
                      usage?.medicine
                        ? {
                            value: usage.medicine.id,
                            label: usage.medicine.name,
                          }
                        : undefined
                    }
                    error={errors.medicineId?.message}
                    register={register}
                    setValue={setValue}
                    validation={{ required: 'Select a medicine' }}
                  />
                  <InputField
                    label="Quantity used"
                    name="quantity"
                    type="number"
                    step="any"
                    registration={register('quantity', { valueAsNumber: true })}
                    error={errors.quantity?.message}
                  />
                  <AppSelect
                    label="Tool used (optional)"
                    name="toolId"
                    placeholder="e.g. Syringe"
                    options={toolOptions}
                    defaultValue={
                      usage?.tool
                        ? {
                            value: usage.tool.id,
                            label: usage.tool.name,
                          }
                        : { value: '', label: 'No tool used' }
                    }
                    error={errors.toolId?.message}
                    register={register}
                    setValue={setValue}
                  />
                  {selectedToolId && (
                    <InputField
                      label="Tool quantity used"
                      name="toolQuantity"
                      type="number"
                      step="any"
                      registration={register('toolQuantity', {
                        valueAsNumber: true,
                      })}
                      error={errors.toolQuantity?.message}
                    />
                  )}
                  <AppSelect
                    label="Animal type"
                    name="animalType"
                    placeholder="Select animal type"
                    options={ANIMAL_TYPE_OPTIONS}
                    defaultValue={typeDefaultValue}
                    error={errors.animalType?.message}
                    register={register}
                    setValue={setValue}
                  />
                  <AppSelect
                    key={animalType}
                    label={`${animalTypeLabel(animalType)} tag`}
                    name="animalId"
                    placeholder={`Select ${animalTypeLabel(animalType).toLowerCase()}`}
                    options={animalOptions}
                    defaultValue={animalDefaultValue}
                    error={errors.animalId?.message}
                    register={register}
                    setValue={setValue}
                    validation={{ required: 'Select the animal' }}
                  />
                  <InputField
                    label="Disease"
                    name="diseaseName"
                    registration={register('diseaseName')}
                    error={errors.diseaseName?.message}
                  />
                  <InputField
                    label="Date"
                    name="date"
                    type="date"
                    registration={register('date')}
                    error={errors.date?.message}
                  />
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? 'Saving…' : 'Update'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default UpdateMedicineUsageModal;
