import { z } from 'zod';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { InputField } from '@/components/input';
import AppSelect from '@/components/select/SelectField';
import { useProductionTransaction } from '@/hooks/api/production_transaction';
import { transitions } from '@mantine/core/lib/Transition/transitions';

const productionTransactionSchema = z.object({
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    productType: z.string().nonempty('Product is required'),
    consumer: z.string().nonempty('Consumer is required'),
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
        setValue,
    } = useForm({
        resolver: zodResolver(productionTransactionSchema),
        defaultValues: transaction,
    });

    useEffect(() => {
        if (!isOpen) {
            reset(transaction);
        }
    }, [isOpen, reset, transaction]);

    const onSubmit = async (data: any) => {
        try {
            await updateProductionTransaction(transaction.id, data);
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
                            <Dialog.Panel className="w-full max-w-md p-6 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                                <Dialog.Title
                                    as="h3"
                                    className="text-lg font-medium leading-6 text-gray-900"
                                >
                                    Update Sale
                                </Dialog.Title>
                                <form
                                    onSubmit={handleSubmit(onSubmit)}
                                    className="mt-4"
                                >
                                    <InputField
                                        label="Quantity"
                                        placeholder="Enter quantity"
                                        type="number"
                                        defaultValue={transaction?.quantity}
                                        error={errors.quantity?.message}
                                        registration={register('quantity', {
                                            valueAsNumber: true,
                                        })}
                                        name={'quantity'}
                                    />
                                    <AppSelect
                                        label="Type"
                                        name="productType"
                                        placeholder="Product Type"
                                        options={[
                                            { value: 'MILK', label: 'Milk' },
                                            { value: 'MEAT', label: 'Meat' },
                                        ]}
                                        defaultValue={{
                                            label: transaction?.productType,
                                            value: transaction?.productType,
                                        }}
                                        error={errors.productType?.message}
                                        register={register}
                                        
                                        setValue={setValue}
                                        validation={{
                                            required: 'Type is required',
                                        }}
                                    />
                                      <InputField
                                        label="Consumer"
                                        placeholder="Enter consumer name"
                                        type="text"
                                        defaultValue={transaction?.consumer}
                                        error={errors.consumer?.message}
                                        registration={register('consumer')}
                                        name={'consumer'}
                                    />
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
