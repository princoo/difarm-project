import { z } from 'zod';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { InputField } from '@/components/input';
import { useMedicines } from '@/hooks/api/medicine';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const medicineItemSchema = z.object({
  name: z.string().min(1, 'Medicine name is required'),
  diseaseName: z.string().min(1, 'Disease name is required'),
  quantity: z.number().gt(0, 'Quantity must be greater than 0'),
  unit: z.enum(['GRAMS', 'LITERS']),
  cost: z.number().min(0, 'Cost cannot be negative'),
});

const schema = z.object({
  purchaseDate: z.string().min(1, 'Date is required'),
  medicines: z.array(medicineItemSchema).min(1, 'Add at least one medicine'),
});

type FormValues = z.infer<typeof schema>;

const emptyMedicine = (): FormValues['medicines'][number] => ({
  name: '',
  diseaseName: '',
  quantity: undefined as unknown as number,
  unit: 'GRAMS',
  cost: undefined as unknown as number,
});

const AddMedicineModal = ({
  isOpen,
  onClose,
  handleRefetch,
}: {
  isOpen: boolean;
  onClose: () => void;
  handleRefetch: () => void;
}) => {
  const { createMedicineBatch, loading } = useMedicines();
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      purchaseDate: new Date().toISOString().slice(0, 10),
      medicines: [emptyMedicine()],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'medicines',
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({
      purchaseDate: new Date().toISOString().slice(0, 10),
      medicines: [emptyMedicine()],
    });
  }, [isOpen, reset]);

  const onSubmit = async (data: FormValues) => {
    try {
      await createMedicineBatch({
        purchaseDate: data.purchaseDate,
        medicines: data.medicines,
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
              <Dialog.Panel className="w-full max-w-3xl p-6 mt-8 mb-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded dark:bg-gray-900">
                <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white text-center">
                  Record medicine purchase
                </Dialog.Title>
                <p className="mt-1 text-xs text-gray-500 text-center">
                  Bought from dairy or veterinary shop — add one or more medicines at once.
                </p>
                <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
                  <InputField
                    label="Purchase date"
                    name="purchaseDate"
                    type="date"
                    registration={register('purchaseDate')}
                    error={errors.purchaseDate?.message}
                  />

                  <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2 relative"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                            Medicine {index + 1}
                          </p>
                          {fields.length > 1 && (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 text-xs text-danger hover:underline"
                              onClick={() => remove(index)}
                            >
                              <TrashIcon className="w-4 h-4" />
                              Remove
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <InputField
                            label="Medicine name"
                            name={`medicines.${index}.name`}
                            placeholder="Enter medicine name"
                            registration={register(`medicines.${index}.name`)}
                            error={errors.medicines?.[index]?.name?.message}
                          />
                          <InputField
                            label="Disease it cures"
                            name={`medicines.${index}.diseaseName`}
                            placeholder="Enter disease name"
                            registration={register(`medicines.${index}.diseaseName`)}
                            error={errors.medicines?.[index]?.diseaseName?.message}
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
                          <InputField
                            className="!my-0"
                            label="Quantity"
                            name={`medicines.${index}.quantity`}
                            type="number"
                            step="any"
                            placeholder="Qty"
                            registration={register(`medicines.${index}.quantity`, {
                              valueAsNumber: true,
                            })}
                            error={errors.medicines?.[index]?.quantity?.message}
                          />
                          <div className="my-0">
                            <label className="block text-sm font-bold">Unit</label>
                            <div className="relative">
                              <select
                                className="mt-0 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm bg-white dark:bg-transparent"
                                {...register(`medicines.${index}.unit`)}
                              >
                                <option value="GRAMS">Grams (g)</option>
                                <option value="LITERS">Liters (L)</option>
                              </select>
                            </div>
                            {errors.medicines?.[index]?.unit && (
                              <p className="text-red-500 text-sm">
                                {errors.medicines[index]?.unit?.message}
                              </p>
                            )}
                          </div>
                          <InputField
                            className="!my-0"
                            label="Cost (expense)"
                            name={`medicines.${index}.cost`}
                            type="number"
                            step="any"
                            placeholder="Purchase cost"
                            registration={register(`medicines.${index}.cost`, {
                              valueAsNumber: true,
                            })}
                            error={errors.medicines?.[index]?.cost?.message}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {errors.medicines?.root?.message && (
                    <p className="text-sm text-red-600">{errors.medicines.root.message}</p>
                  )}
                  {typeof errors.medicines?.message === 'string' && (
                    <p className="text-sm text-red-600">{errors.medicines.message}</p>
                  )}

                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm inline-flex items-center gap-1"
                    onClick={() => append(emptyMedicine())}
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add another medicine
                  </button>

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
                      {loading
                        ? 'Saving…'
                        : fields.length > 1
                          ? `Save ${fields.length} medicines`
                          : 'Save'}
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

export default AddMedicineModal;
