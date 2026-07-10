import { z } from 'zod';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { InputField } from '@/components/input';
import { useStock } from '@/hooks/api/stock';
import { useSuppliers } from '@/hooks/api/suppliers';
import { ITEM_TYPES, STOCK_UNITS } from './stockHelpers';

const stockSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  quantity: z.coerce.number().min(0, 'Quantity must be 0 or more'),
  type: z.string().min(1, 'Category is required'),
  supplierId: z.string().optional(),
  unitOfMeasure: z.string().optional(),
  unitsPerBox: z.coerce.number().optional(),
  itemType: z.string().optional(),
  defaultPurchasePrice: z.coerce.number().optional(),
  reorderLevel: z.coerce.number().optional(),
  status: z.string().optional(),
  description: z.string().optional(),
  leadTimeDays: z.coerce.number().optional(),
});

export default function AddStockModal({
  isOpen,
  onClose,
  handleRefetch,
}: {
  isOpen: boolean;
  onClose: () => void;
  handleRefetch: () => void;
}) {
  const { createStock, loading } = useStock();
  const { suppliers, getSuppliers } = useSuppliers();
  const supplierList: any[] = Array.isArray(suppliers)
    ? suppliers
    : suppliers?.data?.data ?? suppliers?.data ?? [];

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<z.infer<typeof stockSchema>>({
    resolver: zodResolver(stockSchema),
    defaultValues: {
      name: '',
      quantity: 0,
      type: '',
      supplierId: '',
      unitOfMeasure: 'piece',
      itemType: 'consumable',
      status: 'active',
      description: '',
    },
  });

  const unit = watch('unitOfMeasure');

  useEffect(() => {
    if (!isOpen) return;
    getSuppliers('pageSize=100');
    reset({
      quantity: 0,
      unitOfMeasure: 'piece',
      itemType: 'consumable',
      status: 'active',
      name: '',
      type: '',
      supplierId: '',
      description: '',
    });
  }, [isOpen, getSuppliers, reset]);

  const onSubmit = async (data: any) => {
    await createStock(data);
    onClose();
    handleRefetch();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" open={isOpen} onClose={onClose} className="relative z-[999]">
        <div className="fixed inset-0 bg-black/60" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-4 pt-10">
            <Dialog.Panel className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
              <Dialog.Title className="text-lg font-semibold">New Item</Dialog.Title>
              <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
                <div className="grid gap-4 rounded-lg border border-gray-200 p-4 sm:grid-cols-2 dark:border-gray-700">
                  <h3 className="col-span-2 text-sm font-medium text-gray-500">Supplier</h3>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Supplier</label>
                    <select {...register('supplierId')} className="form-select w-full">
                      <option value="">Select supplier</option>
                      {supplierList.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <InputField label="Default purchase price" name="defaultPurchasePrice" type="number" registration={register('defaultPurchasePrice')} />
                  <InputField label="Lead time (days)" name="leadTimeDays" type="number" registration={register('leadTimeDays')} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField label="Name *" name="name" registration={register('name')} error={errors.name?.message} type="text" />
                  <div>
                    <label className="mb-1 block text-sm font-medium">Category *</label>
                    <select {...register('type')} className="form-select w-full">
                      <option value="">Select category</option>
                      <option value="FOOD">Food</option>
                      <option value="MEDICATION">Medication</option>
                      <option value="CONSTRUCTION">Construction</option>
                      <option value="WATER">Water</option>
                      <option value="FEED_ACCESSORIES">Feed Accessories</option>
                      <option value="HYGIENE_MATERIALS">Hygiene Materials</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Unit of measure</label>
                    <select {...register('unitOfMeasure')} className="form-select w-full">
                      {STOCK_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  {unit === 'box' && (
                    <InputField label="Pieces per box *" name="unitsPerBox" type="number" registration={register('unitsPerBox')} />
                  )}
                  <div>
                    <label className="mb-1 block text-sm font-medium">Item type</label>
                    <select {...register('itemType')} className="form-select w-full">
                      {ITEM_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <InputField label="Opening quantity" name="quantity" type="number" registration={register('quantity')} />
                  <InputField label="Reorder level" name="reorderLevel" type="number" registration={register('reorderLevel')} />
                  <div className="sm:col-span-2">
                    <InputField label="Description" name="description" registration={register('description')} type="text" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Status</label>
                    <select {...register('status')} className="form-select w-full">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
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
