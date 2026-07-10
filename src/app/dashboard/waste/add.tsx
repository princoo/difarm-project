import { z } from 'zod';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { InputField } from '@/components/input';
import { useWasteLog } from '@/hooks/api/waste';

const wasteLogSchema = z.object({
    type: z.string().nonempty('Type is required'),
    quantity: z.string().min(1, 'Quantity must be at least 1'),
    date: z.string().nonempty('Date is required'),
});

interface AddWasteLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    handleRefetch: () => void;
}

const AddWasteLogModal: React.FC<AddWasteLogModalProps> = ({
    isOpen,
    onClose,
    handleRefetch,
}) => {
    const { createWasteLog, loading, error } = useWasteLog();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm({
        resolver: zodResolver(wasteLogSchema),
    });

    useEffect(() => {
        if (!isOpen) {
            reset();
        }
    }, [isOpen, reset]);

    const onSubmit = async (data: any) => {
        try {
            const payload: any = {
                type: data.type,
                quantity: parseFloat(data.quantity),
                date: new Date(data.date),
            };
            await createWasteLog(payload);
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
                            <Dialog.Panel className="w-full max-w-md p-6 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded mt-4">
                                <Dialog.Title
                                    as="h3"
                                    className="text-lg font-medium leading-6 text-gray-900"
                                >
                                    Add Waste Log
                                </Dialog.Title>
                                <form
                                    onSubmit={handleSubmit(onSubmit)}
                                    className="mt-4"
                                >
                                   <div className="">
                                        <label
                                            htmlFor="type"
                                            className="block text-sm font-bold text-gray-700"
                                        >
                                            Type
                                        </label>
                                        <select
                                            id="type"
                                            {...register('type')}
                                            className="mt-1 block w-full px-3 py-2 border text-gray-400 border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                                        >
                                            <option value="">
                                                Select Type
                                            </option>

                                            <option value="DUNG">Dung</option>
                                            <option value="LIQUIDMANURE">
                                                Liquid Manure
                                            </option>
                                           
                                           
                                        </select>
                                        {errors.type && (
                                            <p className="text-sm text-red-600">
                                                Type is required
                                            </p>
                                        )}
                                    </div>
                                    <InputField
                                        label="Quantity(KG or Litres)"
                                        placeholder="Enter quantity"
                                        name="quantity"
                                        type="number"
                                        error={errors.quantity?.message}
                                        registration={register('quantity')}
                                    />
                                    <InputField
                                        label="Date"
                                        placeholder="Enter date"
                                        name="date"
                                        type="date"
                                        error={errors.date?.message}
                                        registration={register('date')}
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

export default AddWasteLogModal;
