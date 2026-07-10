import { z } from 'zod';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { InputField } from '@/components/input';
import AppSelect from '@/components/select/SelectField';
import { useStock } from '@/hooks/api/stock';
import { useProductionTransaction } from '@/hooks/api/production_transaction';

const transactionSchema = z.object({
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    productType: z.string().nonempty('Product is required'),
    consumer: z.string().nonempty('Consumer is required'),
});

interface AddProductionTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    handleRefetch: () => void;
}

const AddProductionTransactionModal: React.FC<
    AddProductionTransactionModalProps
> = ({ isOpen, onClose, handleRefetch }) => {
    const { createProductionTransaction, loading, error } =
        useProductionTransaction();
    const [stockOptions, setStockOptions] = useState<
        { value: string; label: string }[]
    >([]);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
    } = useForm({
        resolver: zodResolver(transactionSchema),
    });


    const onSubmit = async (data: any) => {
        try {
            await createProductionTransaction(data);
            onClose();
            handleRefetch();
        } catch (err) {}
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
                                    Add Production Transaction
                                </Dialog.Title>
                                <form
                                    onSubmit={handleSubmit(onSubmit)}
                                    className="mt-4 gap-3 "
                                >
                                    {/* <InputField
                                        label="Date"
                                        name="date"
                                        placeholder="Enter Date"
                                        type="date"
                                        error={errors.date?.message}
                                        registration={register('date')}
                                    /> */}
                                    <InputField
                                        label="Quantity"
                                        name="quantity"
                                        placeholder="Enter Quantity"
                                        type="number"
                                        error={errors.quantity?.message}
                                        registration={register('quantity', {
                                            valueAsNumber: true,
                                        })}
                                    />
                                    <div className="">
                                        <label
                                            htmlFor="productName"
                                            className="block text-sm font-bold text-gray-700"
                                        >
                                            Product
                                        </label>
                                        <select
                                            id="productName"
                                            {...register('productType')}
                                            className="mt-1 block w-full px-3 py-2 border text-gray-400 border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                                        >
                                            <option value="">
                                                Select Product
                                            </option>
                                            <option value="MILK">Milk</option>
                                            <option value="MEAT">Meat</option>
                                        </select>
                                        {errors.productType && (
                                            <p className="text-sm text-red-600">
                                                {errors.productType.message ?? 'Product is required'}
                                            </p>
                                        )}
                                    </div>
                                    <InputField
                                        label="consumer"
                                        
                                        name="consumer"
                                        placeholder="Enter consumer name"
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
                                            disabled={loading}
                                        >
                                            {loading ? 'Adding...' : 'Add'}
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
