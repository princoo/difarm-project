import { z } from 'zod';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { InputField } from '@/components/input';
import AppSelect from '@/components/select/SelectField';
import { useMedicines } from '@/hooks/api/medicine';
import { useCattle } from '@/hooks/api/cattle';

const unitLabel = (unit?: string) =>
  unit === 'LITERS' ? 'L' : unit === 'PIECES' ? 'pcs' : 'g';

const schema = z.object({
  medicineId: z.string().min(1, 'Select a medicine'),
  cattleId: z.string().min(1, 'Select cattle'),
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
  const { cattle, fetchCattle }: any = useCattle();
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

  useEffect(() => {
    if (!isOpen) return;
    fetchCattle('pageSize=500');
  }, [isOpen, fetchCattle]);

  useEffect(() => {
    if (!isOpen || !usage) return;
    reset({
      medicineId: usage.medicineId || usage.medicine?.id || '',
      cattleId: usage.cattleId || usage.cattle?.id || '',
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

  const cattleOptions = (cattle?.data?.data ?? [])
    .filter((c: any) => c.status !== 'SOLD' && c.status !== 'PROCESSED')
    .map((c: any) => ({
      value: c.id,
      label: `${c.tagNumber} (${c.breed})`,
    }));

  const onSubmit = async (data: FormValues) => {
    try {
      await updateUsage(usage.id, {
        medicineId: data.medicineId,
        cattleId: data.cattleId,
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
                    label="Cattle"
                    name="cattleId"
                    placeholder="Select cattle"
                    options={cattleOptions}
                    defaultValue={
                      usage?.cattle
                        ? {
                            value: usage.cattle.id,
                            label: `${usage.cattle.tagNumber}`,
                          }
                        : undefined
                    }
                    error={errors.cattleId?.message}
                    register={register}
                    setValue={setValue}
                    validation={{ required: 'Select cattle' }}
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
