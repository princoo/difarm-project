import { z } from 'zod';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { InputField } from '@/components/input';
import { useProduction } from '@/hooks/api/productions';
import AppSelect from '@/components/select/SelectField';
import { useCattle } from '@/hooks/api/cattle';

const productionSchema = z
  .object({
    cattleId: z.string().nonempty('Cattle is required'),
    productName: z.string().nonempty('Product is required'),
    quantity: z.union([z.string(), z.number()]),
    productionDate: z.string().nonempty('Production date is required'),
    milkingSession: z.string().optional(),
    expirationDate: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.productName === 'MILK' && !data.milkingSession) {
      ctx.addIssue({
        code: 'custom',
        path: ['milkingSession'],
        message: 'Select morning or evening milking',
      });
    }
    if (data.productName === 'MEAT' && !data.expirationDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['expirationDate'],
        message: 'Expiration date is required for meat',
      });
    }
  });

type FormValues = z.infer<typeof productionSchema>;

interface UpdateProductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  handleRefetch: () => void;
  production: any;
}

const UpdateProduction: React.FC<UpdateProductionModalProps> = ({
  isOpen,
  onClose,
  handleRefetch,
  production,
}) => {
  const { updateProduction, loading, error } = useProduction();
  const { fetchCattle, cattle }: any = useCattle();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(productionSchema),
  });

  const selectedProduct = watch('productName');
  const isMilk = selectedProduct === 'MILK';
  const quantityUnit = isMilk ? 'liters' : 'kg';

  useEffect(() => {
    fetchCattle({ pageSize: 500 });
  }, []);

  useEffect(() => {
    if (!production) return;
    reset({
      cattleId: production.cattleId || '',
      productName: production.productName || '',
      quantity: production.quantity ?? '',
      productionDate: production.productionDate
        ? new Date(production.productionDate).toISOString().split('T')[0]
        : '',
      milkingSession: production.milkingSession || '',
      expirationDate: production.expirationDate
        ? new Date(production.expirationDate).toISOString().split('T')[0]
        : '',
    });
    setValue('cattleId', production.cattleId || '');
  }, [production, reset, setValue]);

  const cattleList: any[] = (() => {
    const payload = cattle?.data?.data ?? cattle?.data ?? cattle;
    return Array.isArray(payload) ? payload : [];
  })();

  const options = cattleList.map((item: any) => ({
    value: item.id,
    label: `${item.tagNumber}${item.breed ? ` (${item.breed})` : ''}`,
  }));

  const cattleData =
    production?.cattle ||
    production?.farm?.cattle?.find(
      (item: any) => item.id === production?.cattleId
    );

  const onSubmit = async (data: FormValues) => {
    try {
      const payload = {
        cattleId: data.cattleId,
        productName: data.productName,
        quantity: parseFloat(String(data.quantity)),
        productionDate: data.productionDate,
        milkingSession: data.productName === 'MILK' ? data.milkingSession : null,
        expirationDate:
          data.productName === 'MILK' ? null : data.expirationDate || null,
      };
      await updateProduction(production.id, payload as any);
      onClose();
      handleRefetch();
    } catch (err) {
      console.error(err);
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
              <Dialog.Panel className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-xl my-8 text-black dark:text-white-dark">
                <div className="flex bg-[#fbfbfb] dark:bg-[#121c2c] items-center justify-between px-5 py-3">
                  <div className="font-bold text-lg">Update Production</div>
                </div>
                <div className="p-5">
                  {error && <div className="text-red-500 mb-2">{error}</div>}
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="mb-4">
                        <AppSelect
                          label="Cattle"
                          name="cattleId"
                          placeholder="Select Cattle"
                          options={options}
                          defaultValue={{
                            label: `${cattleData?.tagNumber}(${cattleData?.breed}) `,
                            value: cattleData?.id,
                          }}
                          error={errors.cattleId?.message}
                          register={register}
                          setValue={setValue}
                          validation={{
                            required: 'Cattle is required',
                          }}
                        />
                      </div>
                      <div className="mb-4">
                        <label
                          htmlFor="productName"
                          className="block text-sm font-bold text-gray-700"
                        >
                          Product
                        </label>
                        <select
                          id="productName"
                          {...register('productName')}
                          className="mt-1 block w-full px-3 py-2 border text-gray-400 border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                        >
                          <option value="">Select Product</option>
                          <option value="MILK">Milk</option>
                          <option value="MEAT">Meat</option>
                        </select>
                        {errors.productName && (
                          <p className="text-sm text-red-600">
                            {errors.productName.message}
                          </p>
                        )}
                      </div>

                      {isMilk && (
                        <div className="mb-4">
                          <label
                            htmlFor="milkingSession"
                            className="block text-sm font-bold text-gray-700"
                          >
                            Milking time
                          </label>
                          <select
                            id="milkingSession"
                            {...register('milkingSession')}
                            className="mt-1 block w-full px-3 py-2 border text-gray-400 border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                          >
                            <option value="">Select morning or evening</option>
                            <option value="MORNING">Morning</option>
                            <option value="EVENING">Evening</option>
                          </select>
                          {errors.milkingSession && (
                            <p className="text-sm text-red-600">
                              {errors.milkingSession.message}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="mb-4">
                        <InputField
                          type="number"
                          step="any"
                          label={`Quantity (${quantityUnit})`}
                          placeholder={`Enter quantity in ${quantityUnit}`}
                          registration={register('quantity')}
                          error={errors.quantity?.message as string}
                          name="quantity"
                        />
                      </div>
                      <div className="mb-4">
                        <InputField
                          type="date"
                          label="Production Date"
                          placeholder="Enter production date"
                          registration={register('productionDate')}
                          error={errors.productionDate?.message}
                          name="productionDate"
                        />
                      </div>
                      {!isMilk && (
                        <div className="mb-4">
                          <InputField
                            type="date"
                            label="Expiration Date"
                            placeholder="Enter expiration date"
                            registration={register('expirationDate')}
                            error={errors.expirationDate?.message}
                            name="expirationDate"
                          />
                        </div>
                      )}
                      {isMilk && (
                        <div className="mb-4 col-span-2">
                          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                            Milk expires the same day (within 24 hours). No
                            expiration date is required.
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end items-center mt-8">
                      <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-outline-danger"
                      >
                        Discard
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary ltr:ml-4 rtl:mr-4"
                        disabled={loading}
                      >
                        {loading ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </form>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default UpdateProduction;
