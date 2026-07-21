import { z } from 'zod';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { InputField } from '@/components/input';
import { useProductionTransaction } from '@/hooks/api/production_transaction';
import type { DailySaleRow } from '@/hooks/api/production_transaction';

const nonNegNumber = z.preprocess(
  (v) => (v === '' || v === null || v === undefined || Number.isNaN(v) ? 0 : Number(v)),
  z.number().min(0)
);

const usageFormSchema = z
  .object({
    productType: z.string().nonempty('Product is required'),
    date: z.string().nonempty('Production day is required'),
    dairyQuantity: nonNegNumber,
    unitPrice: nonNegNumber,
    dairyName: z.string().optional(),
    farmQuantity: nonNegNumber,
    umucundaQuantity: nonNegNumber,
  })
  .superRefine((data, ctx) => {
    if (data.dairyQuantity > 0) {
      if (!data.dairyName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Dairy name is required when quantity sold > 0',
          path: ['dairyName'],
        });
      }
      if (!(Number(data.unitPrice) > 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Unit price is required when quantity sold > 0',
          path: ['unitPrice'],
        });
      }
    }
  });

export type SaleDraft = Partial<DailySaleRow> & {
  date?: string;
  productType?: string;
  remaining?: number;
  pricePerUnit?: number;
};

interface AddProductionTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  handleRefetch: () => void;
  draft?: SaleDraft | null;
}

const AddProductionTransactionModal: React.FC<
  AddProductionTransactionModalProps
> = ({ isOpen, onClose, handleRefetch, draft }) => {
  const { createProductionUsageBatch, loading } = useProductionTransaction();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(usageFormSchema),
    defaultValues: {
      productType: 'MILK',
      date: '',
      dairyQuantity: 0,
      unitPrice: 0,
      dairyName: '',
      farmQuantity: 0,
      umucundaQuantity: 0,
    },
  });

  const dairyQuantity = watch('dairyQuantity');
  const farmQuantity = watch('farmQuantity');
  const umucundaQuantity = watch('umucundaQuantity');
  const unitPrice = watch('unitPrice');
  const remaining = draft?.remaining;

  const dairyRevenue = useMemo(() => {
    const qty = Number(dairyQuantity) || 0;
    const price = Number(unitPrice) || 0;
    return qty > 0 && price > 0 ? qty * price : 0;
  }, [dairyQuantity, unitPrice]);

  const totalUsed =
    (Number(dairyQuantity) || 0) +
    (Number(farmQuantity) || 0) +
    (Number(umucundaQuantity) || 0);

  useEffect(() => {
    if (!isOpen) return;
    const today = new Date().toISOString().slice(0, 10);
    reset({
      productType: draft?.productType ?? 'MILK',
      date: draft?.date ?? today,
      dairyQuantity: 0,
      unitPrice: draft?.pricePerUnit ?? 0,
      dairyName: '',
      farmQuantity: 0,
      umucundaQuantity: 0,
    });
  }, [isOpen, draft, reset]);

  const onSubmit = async (data: z.infer<typeof usageFormSchema>) => {
    try {
      if (remaining != null && totalUsed > remaining) {
        return;
      }
      await createProductionUsageBatch({
        productType: data.productType,
        date: data.date,
        usages: [
          {
            usageCategory: 'SOLD_TO_DAIRY',
            quantity: Number(data.dairyQuantity) || 0,
            unitPrice: Number(data.unitPrice) || 0,
            consumer: data.dairyName?.trim() || '',
            amountPaid: dairyRevenue,
          },
          {
            usageCategory: 'USED_ON_FARM',
            quantity: Number(data.farmQuantity) || 0,
          },
          {
            usageCategory: 'CONSUMED_BY_UMUCUNDA',
            quantity: Number(data.umucundaQuantity) || 0,
          },
        ],
      });
      onClose();
      handleRefetch();
    } catch {
      /* toast already shown */
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
              <Dialog.Panel className="w-full max-w-lg p-6 overflow-hidden text-left mt-4 align-middle transition-all transform bg-white shadow-xl rounded">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Production usage
                </Dialog.Title>
                {remaining != null && (
                  <p className="mt-2 text-sm text-gray-700">
                    Remaining this day:{' '}
                    <span className="font-semibold">{remaining}</span>
                    {totalUsed > 0 && (
                      <span className="text-gray-500">
                        {' '}
                        · Total entered: {totalUsed}
                      </span>
                    )}
                  </p>
                )}

                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="mt-3 space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                    <InputField
                      label="Production day"
                      name="date"
                      type="date"
                      className="!my-0"
                      error={errors.date?.message}
                      registration={register('date')}
                    />
                    <div className="my-0">
                      <label
                        htmlFor="productType"
                        className="block text-sm font-bold"
                      >
                        Product
                      </label>
                      <div className="relative">
                        <select
                          id="productType"
                          {...register('productType')}
                          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                        >
                          <option value="MILK">Milk</option>
                          <option value="MEAT">Meat</option>
                          <option value="DUNG">Dung</option>
                          <option value="LIQUIDMANURE">Liquid manure</option>
                        </select>
                      </div>
                      {errors.productType && (
                        <p className="text-red-500 text-sm">
                          {errors.productType.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Sold to dairy */}
                  <section className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                    <h4 className="text-sm font-semibold text-primary text-center">
                      Sold to dairy
                    </h4>
                    <div className="grid grid-cols-2 gap-3 items-start">
                      <InputField
                        label="Quantity sold"
                        name="dairyQuantity"
                        type="number"
                        step="any"
                        className="!my-0"
                        error={errors.dairyQuantity?.message}
                        registration={register('dairyQuantity', {
                          valueAsNumber: true,
                        })}
                      />
                      <InputField
                        label="Unit price"
                        name="unitPrice"
                        type="number"
                        step="any"
                        className="!my-0"
                        error={errors.unitPrice?.message}
                        registration={register('unitPrice', {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                    <InputField
                      label="Dairy name"
                      name="dairyName"
                      type="text"
                      placeholder="Name of the dairy"
                      error={errors.dairyName?.message}
                      registration={register('dairyName')}
                    />
                  </section>

                  {/* Used on farm */}
                  <section className="rounded-lg border border-sky-300/50 bg-sky-50/60 p-3 space-y-2">
                    <h4 className="text-sm font-semibold text-sky-700 text-center">
                      Used on farm
                    </h4>
                    <InputField
                      label="Quantity used"
                      name="farmQuantity"
                      type="number"
                      step="any"
                      error={errors.farmQuantity?.message}
                      registration={register('farmQuantity', {
                        valueAsNumber: true,
                      })}
                    />
                  </section>

                  {/* Consumed by umucunda */}
                  <section className="rounded-lg border border-amber-300/50 bg-amber-50/60 p-3 space-y-2">
                    <h4 className="text-sm font-semibold text-amber-800 text-center">
                      Consumed by umucunda
                    </h4>
                    <InputField
                      label="Quantity consumed"
                      name="umucundaQuantity"
                      type="number"
                      step="any"
                      error={errors.umucundaQuantity?.message}
                      registration={register('umucundaQuantity', {
                        valueAsNumber: true,
                      })}
                    />
                  </section>

                  {remaining != null && totalUsed > remaining && (
                    <p className="text-sm text-red-600">
                      Total ({totalUsed}) cannot exceed remaining ({remaining}).
                    </p>
                  )}

                  <div className="mt-2 flex justify-end space-x-2">
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
                      disabled={
                        loading ||
                        (remaining != null && totalUsed > remaining)
                      }
                    >
                      {loading ? 'Saving…' : 'Save usage'}
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

export default AddProductionTransactionModal;
