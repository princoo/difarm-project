import { z } from 'zod';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { InputField } from '@/components/input';
import { useSuppliers } from '@/hooks/api/suppliers';

const schema = z.object({
  name: z.string().min(2),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  status: z.string().optional(),
});

export default function UpdateSupplierModal({
  isOpen,
  onClose,
  supplier,
  handleRefetch,
}: {
  isOpen: boolean;
  onClose: () => void;
  supplier: any;
  handleRefetch: () => void;
}) {
  const { updateSupplier, loading } = useSuppliers();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (isOpen && supplier) reset(supplier);
  }, [isOpen, supplier, reset]);

  const onSubmit = async (data: any) => {
    if (!supplier?.id) return;
    await updateSupplier(supplier.id, data);
    onClose();
    handleRefetch();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" open={isOpen} onClose={onClose} className="relative z-[999]">
        <div className="fixed inset-0 bg-black/60" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
              <Dialog.Title className="text-lg font-semibold">Edit Supplier</Dialog.Title>
              <form onSubmit={handleSubmit(onSubmit)} className="mt-4 grid gap-4 sm:grid-cols-2">
                <InputField label="Name *" registration={register('name')} error={errors.name?.message} type="text" name="name" />
                <InputField label="Contact person" registration={register('contactPerson')} type="text" name="contactPerson" />
                <InputField label="Phone" registration={register('phone')} type="text" name="phone" />
                <InputField label="Email" registration={register('email')} type="email" name="email" />
                <div className="sm:col-span-2">
                  <InputField label="Address" registration={register('address')} type="text" name="address" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Status</label>
                  <select {...register('status')} className="form-select w-full">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="sm:col-span-2 flex justify-end gap-2">
                  <button type="button" className="btn btn-outline-danger" onClick={onClose}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>Save</button>
                </div>
              </form>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
