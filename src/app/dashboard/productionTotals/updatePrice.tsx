import { z } from 'zod';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { InputField } from '@/components/input';
import { useProductionTransaction } from '@/hooks/api/production_totals';

const updateTransactionSchema = z.object({
    pricePerUnit: z.number().min(0.01, 'Price per unit must be at least 0.01'),
});

interface UpdateProductionTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    handleRefetch: () => void;
    transaction: any; // Update the type according to your data structure
}

const UpdateProductionTransactionModal: React.FC<
    UpdateProductionTransactionModalProps
> = ({ isOpen, onClose, handleRefetch, transaction }) => {
    const { updateProductionTransaction, loading } = useProductionTransaction();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
    } = useForm({
        resolver: zodResolver(updateTransactionSchema),
        defaultValues: {
            pricePerUnit: transaction?.pricePerUnit ?? 0,
        },
    });

    useEffect(() => {
        if (transaction) {
            setValue('pricePerUnit', transaction.pricePerUnit);
        }
    }, [transaction, setValue]);

    const onSubmit = async (data: any) => {
        try {
            const payload: any = {
                pricePerUnit: data.pricePerUnit,
                
             
            }
            await updateProductionTransaction(transaction.id,payload);
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
                                    Update Price Per Unit
                                </Dialog.Title>
                                <form
                                    onSubmit={handleSubmit(onSubmit)}
                                    className="mt-4 gap-3"
                                >
                                    <InputField
                                        label="Price Per Unit"
                                        name="pricePerUnit"
                                        placeholder="Enter Price Per Unit"
                                        type="number"
                                        error={errors.pricePerUnit?.message}
                                        registration={register('pricePerUnit', {
                                            valueAsNumber: true,
                                        })}
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
                                            {loading
                                                ? 'Updating...'
                                                : 'Update'}
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
