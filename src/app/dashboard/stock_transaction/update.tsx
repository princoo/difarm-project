import { z } from 'zod';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { InputField } from '@/components/input';
import AppSelect from '@/components/select/SelectField';
import { useStockTransaction } from '@/hooks/api/stock_transactions';
import { useStock } from '@/hooks/api/stock';
import { useSuppliers } from '@/hooks/api/suppliers';
import { STOCK_IN_STATUSES, STOCK_OUT_REASONS } from '../stock/stockHelpers';

const baseSchema = z.object({
  stockId: z.string().min(1, 'Item is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  type: z.string().min(1),
  reference: z.string().optional(),
  reason: z.string().optional(),
  unitCost: z.coerce.number().optional(),
  expiryDate: z.string().optional(),
  expiryNote: z.string().optional(),
  status: z.string().optional(),
  supplierId: z.string().optional(),
});

export default function UpdateStockTransactionModal({
  isOpen,
  onClose,
  transaction,
  handleRefetch,
}: {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
  handleRefetch: () => void;
}) {
  const { updateTransaction, loading } = useStockTransaction();
  const { stocks, getStock }: any = useStock();
  const { suppliers, getSuppliers } = useSuppliers();
  const supplierList: any[] = Array.isArray(suppliers)
    ? suppliers
    : suppliers?.data?.data ?? suppliers?.data ?? [];

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    resolver: zodResolver(baseSchema),
  });

  useEffect(() => {
    if (!isOpen || !transaction) return;
    getStock('pageSize=100');
    getSuppliers('pageSize=100');
    reset({
      stockId: transaction.stockId ?? transaction.stock?.id,
      quantity: transaction.quantity,
      type: transaction.type,
      reference: transaction.reference ?? '',
      reason: transaction.reason ?? '',
      unitCost: transaction.unitCost ?? undefined,
      expiryDate: transaction.expiryDate?.slice?.(0, 10) ?? '',
      expiryNote: transaction.expiryNote ?? '',
      status: transaction.status ?? 'CONFIRMED',
      supplierId: transaction.supplierId ?? '',
    });
  }, [isOpen, transaction, getStock, getSuppliers, reset]);

  const options = stocks?.data?.data?.map((stock: any) => ({
    value: stock.id,
    label: stock.name,
  })) ?? [];

  const isStockIn = transaction?.type === 'ADDITION';

  const onSubmit = async (data: any) => {
    if (!transaction?.id) return;
    await updateTransaction(transaction.id, data);
    onClose();
    handleRefetch();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" open={isOpen} onClose={onClose} className="relative z-[999]">
        <div className="fixed inset-0 bg-black/60" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-4 pt-10">
            <Dialog.Panel className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
              <Dialog.Title className="text-lg font-semibold">
                {isStockIn ? 'Edit Stock-In' : 'Edit Stock-Out'}
              </Dialog.Title>
              <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
                <AppSelect
                  label="Item *"
                  name="stockId"
                  placeholder="Select item"
                  options={options}
                  error={errors.stockId?.message}
                  register={register}
                  setValue={setValue}
                  validation={{ required: true }}
                />
                <InputField label="Quantity *" name="quantity" type="number" registration={register('quantity')} error={errors.quantity?.message} />
                {isStockIn ? (
                  <>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Supplier</label>
                      <select {...register('supplierId')} className="form-select w-full">
                        <option value="">Select supplier</option>
                        {supplierList.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <InputField label="Reference" name="reference" registration={register('reference')} type="text" />
                    <InputField label="Unit cost" name="unitCost" type="number" registration={register('unitCost')} />
                    <InputField label="Expiry date" name="expiryDate" type="date" registration={register('expiryDate')} />
                    <InputField label="Expiry note" name="expiryNote" registration={register('expiryNote')} type="text" />
                    <div>
                      <label className="mb-1 block text-sm font-medium">Status</label>
                      <select {...register('status')} className="form-select w-full">
                        {STOCK_IN_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Reason</label>
                      <select {...register('reason')} className="form-select w-full">
                        {STOCK_OUT_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </div>
                    <InputField label="Reference / notes" name="reference" registration={register('reference')} type="text" />
                  </>
                )}
                <input type="hidden" {...register('type')} />
                <div className="flex justify-end gap-2">
                  <button type="button" className="btn btn-outline-danger" onClick={onClose}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
                </div>
              </form>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
