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

const AddMedicineUsageModal = ({
  isOpen,
  onClose,
  handleRefetch,
  medicinesList = [],
}: {
  isOpen: boolean;
  onClose: () => void;
  handleRefetch: () => void;
  medicinesList?: any[];
}) => {
  const { createUsage, loading } = useMedicines();
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
    defaultValues: {
      medicineId: '',
      animalType: 'CATTLE',
      animalId: '',
      quantity: undefined as unknown as number,
      diseaseName: '',
      date: new Date().toISOString().slice(0, 10),
      toolId: '',
      toolQuantity: 1,
    },
  });

  const selectedMedicineId = useWatch({ control, name: 'medicineId' });
  const selectedToolId = useWatch({ control, name: 'toolId' });
  const animalType = useWatch({ control, name: 'animalType' }) ?? 'CATTLE';

  const selectedMedicine = useMemo(
    () => medicinesList.find((m) => m.id === selectedMedicineId),
    [medicinesList, selectedMedicineId]
  );
  const selectedTool = useMemo(
    () => medicinesList.find((m) => m.id === selectedToolId),
    [medicinesList, selectedToolId]
  );

  useEffect(() => {
    if (!isOpen || !selectedFarmId) return;
    fetchCattleOnSelectedFarm('pageSize=500');
    fetchLivestockOnSelectedFarm();
    reset({
      medicineId: '',
      animalType: 'CATTLE',
      animalId: '',
      quantity: undefined as unknown as number,
      diseaseName: '',
      date: new Date().toISOString().slice(0, 10),
      toolId: '',
      toolQuantity: 1,
    });
  }, [isOpen, selectedFarmId, fetchCattleOnSelectedFarm, fetchLivestockOnSelectedFarm, reset]);

  useEffect(() => {
    if (selectedMedicine?.diseaseName) {
      setValue('diseaseName', selectedMedicine.diseaseName);
    }
  }, [selectedMedicine, setValue]);

  // Each type has its own list — clear the tag when the type changes.
  useEffect(() => {
    setValue('animalId', '');
  }, [animalType, setValue]);

  const medicineOptions = medicinesList
    .filter((m) => (m.itemType ?? 'MEDICINE') !== 'TOOL' && Number(m.quantity) > 0)
    .map((m) => ({
      value: m.id,
      label: `${m.name} (${Number(m.quantity).toLocaleString()} ${unitLabel(
        m.unit
      )} left)`,
    }));

  const toolOptions = [
    { value: '', label: 'No tool used' },
    ...medicinesList
      .filter((m) => m.itemType === 'TOOL' && Number(m.quantity) > 0)
      .map((m) => ({
        value: m.id,
        label: `${m.name} (${Number(m.quantity).toLocaleString()} ${unitLabel(
          m.unit
        )} left)`,
      })),
  ];

  const animalOptions = buildAnimalOptions(
    animalType,
    cattle?.data?.data,
    allLivestock?.data?.data
  );

  const onSubmit = async (data: FormValues) => {
    try {
      const payload: Record<string, unknown> = {
        medicineId: data.medicineId,
        [animalPayloadKey(data.animalType)]: data.animalId,
        quantity: data.quantity,
        diseaseName: data.diseaseName,
        date: data.date,
      };
      if (data.toolId) {
        payload.toolId = data.toolId;
        payload.toolQuantity = data.toolQuantity ?? 1;
      }
      await createUsage(payload);
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
                  Record medicine usage
                </Dialog.Title>
                <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3">
                  <AppSelect
                    label="Medicine"
                    name="medicineId"
                    placeholder="Select medicine"
                    options={medicineOptions}
                    error={errors.medicineId?.message}
                    register={register}
                    setValue={setValue}
                    validation={{ required: 'Select a medicine' }}
                  />
                  {selectedMedicine && (
                    <p className="text-xs text-gray-500">
                      Available:{' '}
                      {Number(selectedMedicine.quantity).toLocaleString()}{' '}
                      {unitLabel(selectedMedicine.unit)}
                    </p>
                  )}
                  <InputField
                    label="Quantity to use"
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
                    error={errors.toolId?.message}
                    register={register}
                    setValue={setValue}
                  />
                  {selectedToolId && (
                    <>
                      {selectedTool && (
                        <p className="text-xs text-gray-500">
                          Tool stock:{' '}
                          {Number(selectedTool.quantity).toLocaleString()}{' '}
                          {unitLabel(selectedTool.unit)}
                        </p>
                      )}
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
                    </>
                  )}
                  <AppSelect
                    label="Animal type"
                    name="animalType"
                    placeholder="Select animal type"
                    options={ANIMAL_TYPE_OPTIONS}
                    defaultValue={ANIMAL_TYPE_OPTIONS[0]}
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
                    error={errors.animalId?.message}
                    register={register}
                    setValue={setValue}
                    validation={{ required: 'Select the animal' }}
                  />
                  <InputField
                    label="Disease"
                    name="diseaseName"
                    placeholder="Disease being treated"
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
                      disabled={loading || medicineOptions.length === 0}
                    >
                      {loading ? 'Saving…' : 'Save'}
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

export default AddMedicineUsageModal;
