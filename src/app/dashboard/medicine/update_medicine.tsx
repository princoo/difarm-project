import { z } from 'zod';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { InputField } from '@/components/input';
import { useMedicines } from '@/hooks/api/medicine';

const schema = z.object({
  name: z.string().min(1, 'Medicine name is required'),
  diseaseName: z.string().min(1, 'Disease name is required'),
  quantity: z.number().min(0, 'Quantity cannot be negative'),
  unit: z.enum(['GRAMS', 'LITERS']),
  cost: z.number().min(0, 'Cost cannot be negative'),
  purchaseDate: z.string().min(1, 'Date is required'),
});

type FormValues = z.infer<typeof schema>;

const UpdateMedicineModal = ({
  isOpen,
  onClose,
  medicine,
  handleRefetch,
}: {
  isOpen: boolean;
  onClose: () => void;
  medicine: any;
  handleRefetch: () => void;
}) => {
  const { updateMedicine, loading } = useMedicines();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!isOpen || !medicine) return;
    reset({
      name: medicine.name || '',
      diseaseName: medicine.diseaseName || '',
      quantity: Number(medicine.quantity) || 0,
      unit: medicine.unit === 'LITERS' ? 'LITERS' : 'GRAMS',
      cost: Number(medicine.cost) || 0,
      purchaseDate: medicine.purchaseDate
        ? String(medicine.purchaseDate).slice(0, 10)
        : '',
    });
  }, [isOpen, medicine, reset]);

  const onSubmit = async (data: FormValues) => {
    try {
      await updateMedicine(medicine.id, data);
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
              <Dialog.Panel className="w-full max-w-md p-6 mt-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded dark:bg-gray-900">
                <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white">
                  Edit medicine
                </Dialog.Title>
                <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3">
                  <InputField
                    label="Medicine name"
                    name="name"
                    registration={register('name')}
                    error={errors.name?.message}
                  />
                  <InputField
                    label="Disease it cures"
                    name="diseaseName"
                    registration={register('diseaseName')}
                    error={errors.diseaseName?.message}
                  />
                  <div className="grid grid-cols-2 gap-3 items-start">
                    <InputField
                      className="!my-0"
                      label="Quantity on hand"
                      name="quantity"
                      type="number"
                      step="any"
                      registration={register('quantity', { valueAsNumber: true })}
                      error={errors.quantity?.message}
                    />
                    <div className="my-0">
                      <label className="block text-sm font-bold">Unit</label>
                      <div className="relative">
                        <select
                          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm bg-white dark:bg-transparent"
                          {...register('unit')}
                        >
                          <option value="GRAMS">Grams (g)</option>
                          <option value="LITERS">Liters (L)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <InputField
                    label="Cost (expense)"
                    name="cost"
                    type="number"
                    step="any"
                    registration={register('cost', { valueAsNumber: true })}
                    error={errors.cost?.message}
                  />
                  <InputField
                    label="Purchase date"
                    name="purchaseDate"
                    type="date"
                    registration={register('purchaseDate')}
                    error={errors.purchaseDate?.message}
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

export default UpdateMedicineModal;
