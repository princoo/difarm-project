import { z } from 'zod';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { InputField } from '@/components/input';
import { useProductionTransaction } from '@/hooks/api/production_transaction';
import type { DailySaleRow } from '@/hooks/api/production_transaction';

const transactionSchema = z.object({
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  productType: z.string().nonempty('Product is required'),
  date: z.string().nonempty('Production day is required'),
  consumer: z.string().nonempty('Buyer is required'),
  amountPaid: z.number().min(0, 'Amount paid cannot be negative'),
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
  /** Prefill from a daily row (Sell action) */
  draft?: SaleDraft | null;
}

const AddProductionTransactionModal: React.FC<
  AddProductionTransactionModalProps
> = ({ isOpen, onClose, handleRefetch, draft }) => {
  const { createProductionTransaction, loading } = useProductionTransaction();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      quantity: 0,
      productType: '',
      date: '',
      consumer: '',
      amountPaid: 0,
    },
  });

  const quantity = watch('quantity');
  const pricePerUnit = draft?.pricePerUnit ?? 0;
  const remaining = draft?.remaining;
  const estimatedValue =
    Number(quantity) > 0 && pricePerUnit > 0
      ? Number(quantity) * pricePerUnit
      : 0;

  useEffect(() => {
    if (!isOpen) return;
    const today = new Date().toISOString().slice(0, 10);
    const qtyDefault =
      draft?.remaining != null && draft.remaining > 0 ? draft.remaining : 0;
    const valueDefault =
      qtyDefault > 0 && (draft?.pricePerUnit ?? 0) > 0
        ? qtyDefault * (draft?.pricePerUnit ?? 0)
        : 0;
    reset({
      quantity: qtyDefault,
      productType: draft?.productType ?? '',
      date: draft?.date ?? today,
      consumer: '',
      amountPaid: valueDefault,
    });
  }, [isOpen, draft, reset]);

  useEffect(() => {
    if (!isOpen || pricePerUnit <= 0) return;
    if (Number(quantity) > 0) {
      setValue('amountPaid', Number(quantity) * pricePerUnit);
    }
  }, [quantity, pricePerUnit, isOpen, setValue]);

  const onSubmit = async (data: any) => {
    try {
      if (remaining != null && data.quantity > remaining) {
        return;
      }
      await createProductionTransaction({
        quantity: data.quantity,
        productType: data.productType,
        date: data.date,
        consumer: data.consumer,
        amountPaid: data.amountPaid,
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
              <Dialog.Panel className="w-full max-w-md p-6 overflow-hidden text-left mt-4 align-middle transition-all transform bg-white shadow-xl rounded">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Record Sale
                </Dialog.Title>
                <p className="mt-1 text-sm text-gray-500">
                  Sell from that day&apos;s total production. Paid can be partial.
                </p>
                {remaining != null && (
                  <p className="mt-2 text-sm text-gray-700">
                    Remaining unsold this day:{' '}
                    <span className="font-semibold">{remaining}</span>
                    {pricePerUnit > 0 && (
                      <>
                        {' '}
                        · Price:{' '}
                        <span className="font-semibold">
                          {pricePerUnit.toLocaleString()} / unit
                        </span>
                      </>
                    )}
                  </p>
                )}
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="mt-4 space-y-3"
                >
                  <InputField
                    label="Production day"
                    name="date"
                    placeholder="YYYY-MM-DD"
                    type="date"
                    error={errors.date?.message}
                    registration={register('date')}
                  />
                  <div>
                    <label
                      htmlFor="productType"
                      className="block text-sm font-bold text-gray-700"
                    >
                      Product
                    </label>
                    <select
                      id="productType"
                      {...register('productType')}
                      className="mt-1 block w-full px-3 py-2 border text-gray-700 border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                    >
                      <option value="">Select Product</option>
                      <option value="MILK">Milk</option>
                      <option value="MEAT">Meat</option>
                      <option value="DUNG">Dung</option>
                      <option value="LIQUIDMANURE">Liquid manure</option>
                    </select>
                    {errors.productType && (
                      <p className="text-sm text-red-600">
                        {errors.productType.message ?? 'Product is required'}
                      </p>
                    )}
                  </div>
                  <InputField
                    label="Quantity sold"
                    name="quantity"
                    placeholder="Enter quantity"
                    type="number"
                    error={
                      remaining != null &&
                      Number(quantity) > remaining
                        ? `Cannot exceed remaining (${remaining})`
                        : errors.quantity?.message
                    }
                    registration={register('quantity', {
                      valueAsNumber: true,
                    })}
                  />
                  {estimatedValue > 0 && (
                    <p className="text-sm text-gray-600">
                      Sale value:{' '}
                      <span className="font-semibold">
                        {estimatedValue.toLocaleString()}
                      </span>
                    </p>
                  )}
                  <InputField
                    label="Amount paid"
                    name="amountPaid"
                    placeholder="Amount paid now"
                    type="number"
                    error={errors.amountPaid?.message}
                    registration={register('amountPaid', {
                      valueAsNumber: true,
                    })}
                  />
                  <InputField
                    label="Buyer"
                    name="consumer"
                    placeholder="Who bought this product"
                    type="text"
                    error={errors.consumer?.message}
                    registration={register('consumer')}
                  />
                  <div className="mt-4 flex justify-end space-x-2">
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
                        (remaining != null && Number(quantity) > remaining)
                      }
                    >
                      {loading ? 'Saving…' : 'Save sale'}
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
