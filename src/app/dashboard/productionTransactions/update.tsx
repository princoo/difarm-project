import { z } from 'zod';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { InputField } from '@/components/input';
import { useProductionTransaction } from '@/hooks/api/production_transaction';

const productionTransactionSchema = z.object({
    quantity: z.number().min(0, 'Quantity cannot be negative'),
    consumer: z.string().optional(),
    unitPrice: z.number().min(0, 'Unit price cannot be negative').optional(),
    amountPaid: z.number().min(0, 'Amount paid cannot be negative').optional(),
});

interface UpdateProductionTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: any;
    handleRefetch: () => void;
}

const UpdateProductionTransactionModal: React.FC<
    UpdateProductionTransactionModalProps
> = ({ isOpen, onClose, transaction, handleRefetch }) => {
    const { updateProductionTransaction, loading, error} = useProductionTransaction();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm({
        resolver: zodResolver(productionTransactionSchema),
    });

    useEffect(() => {
        if (isOpen && transaction) {
            reset({
                quantity: Number(transaction.quantity) || 0,
                consumer: transaction.consumer || '',
                unitPrice: Number(transaction.unitPrice) || 0,
                amountPaid:
                    transaction.amountPaid == null
                        ? Number(transaction.value) || 0
                        : Number(transaction.amountPaid) || 0,
            });
        }
    }, [isOpen, reset, transaction]);

    const onSubmit = async (data: any) => {
        try {
            await updateProductionTransaction(transaction.id, data);
            onClose();
            handleRefetch();
        } catch (err) {
            // The API hook displays the error message.
        }
    };

    const isDairy =
        !transaction?.usageCategory ||
        transaction?.usageCategory === 'SOLD_TO_DAIRY';

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
                            <Dialog.Panel className="w-full max-w-md p-6 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                                <Dialog.Title
                                    as="h3"
                                    className="text-lg font-medium leading-6 text-gray-900"
                                >
                                    Edit production usage
                                </Dialog.Title>
                                <p className="mt-1 text-sm text-gray-500">
                                    {transaction?.productType} ·{' '}
                                    {transaction?.usageCategory === 'USED_ON_FARM'
                                        ? 'Used on farm'
                                        : transaction?.usageCategory ===
                                            'CONSUMED_BY_UMUCUNDA'
                                          ? 'Consumed by Umucunda'
                                          : 'Sold to dairy'}
                                </p>
                                <form
                                    onSubmit={handleSubmit(onSubmit)}
                                    className="mt-4"
                                >
                                    <InputField
                                        label="Quantity"
                                        placeholder="Enter quantity"
                                        type="number"
                                        step="any"
                                        error={errors.quantity?.message}
                                        registration={register('quantity', {
                                            valueAsNumber: true,
                                        })}
                                        name={'quantity'}
                                    />
                                    {isDairy && (
                                        <>
                                            <InputField
                                                label="Dairy name"
                                                placeholder="Enter dairy name"
                                                type="text"
                                                error={errors.consumer?.message}
                                                registration={register('consumer')}
                                                name="consumer"
                                            />
                                            <InputField
                                                label="Unit price"
                                                placeholder="Enter unit price"
                                                type="number"
                                                step="any"
                                                error={errors.unitPrice?.message}
                                                registration={register('unitPrice', {
                                                    valueAsNumber: true,
                                                })}
                                                name="unitPrice"
                                            />
                                            <InputField
                                                label="Amount paid"
                                                placeholder="Enter amount paid"
                                                type="number"
                                                step="any"
                                                error={errors.amountPaid?.message}
                                                registration={register('amountPaid', {
                                                    valueAsNumber: true,
                                                })}
                                                name="amountPaid"
                                            />
                                        </>
                                    )}
                                    <div className="mt-4 flex justify-end space-x-2">
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={onClose}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={loading}
                                        >
                                            {loading ? 'Updating...' : 'Update'}
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

export default UpdateProductionTransactionModal;
