import { z } from 'zod';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { InputField } from '@/components/input';
import AppSelect from '@/components/select/SelectField';
import { useCattle } from '@/hooks/api/cattle';
import { useVeterinarians } from '@/hooks/api/vet';
import { useInseminationRecords } from '@/hooks/api/insemination';

const inseminationRecordSchema = z.object({
    cattleId: z.string().nonempty('Cattle ID is required'),
    method: z.string().nonempty('Method is required'),
    type: z.string().nonempty('Type is required'),
    vetId: z.string().nonempty('Veterinarian ID is required'),
    date: z.string().nonempty('Date is required'),
});

interface AddInseminationRecordModalProps {
    isOpen: boolean;
    onClose: () => void;
    handleRefetch: () => void;
}

const AddInseminationRecordModal: React.FC<AddInseminationRecordModalProps> = ({
    isOpen,
    onClose,
    handleRefetch,
}) => {
    const { createInseminationRecord, loading, error } = useInseminationRecords();
    const { cattle, fetchCattle }: any = useCattle();
    const { veterinarians, getVeterinarians }: any = useVeterinarians();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
    } = useForm({
        resolver: zodResolver(inseminationRecordSchema),
    });

    useEffect(() => {
        fetchCattle('pageSize=100000');
        getVeterinarians('pageSize=1000000');
    }, []);

    const cattleOptions = cattle?.data?.data
    ?.filter((item: any) => item.status !== 'SOLD' && item.status !== 'PROCESSED')
    .map((item: any) => ({
      value: item.id,
      label: item.tagNumber,
    }));
  

    const vetOptions = veterinarians?.data?.data?.map((item: any) => ({
        value: item.id,
        label: `${item.name}`,
    }));
const farmId = localStorage.getItem('FarmId');
    const onSubmit = async (data: any) => {
        try {
            const payload = {
                ...data,
                farmId:farmId
            }
            await createInseminationRecord(payload);
            onClose();
            handleRefetch();
        } catch (err) {
            console.error(err);
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
                                    Add Insemination Record
                                </Dialog.Title>
                                <form
                                    onSubmit={handleSubmit(onSubmit)}
                                    className="mt-4"
                                >
                                    <AppSelect
                                        label="Cattle ID"
                                        name="cattleId"
                                        placeholder="Select Cattle ID"
                                        options={cattleOptions}
                                        error={errors.cattleId?.message}
                                        register={register}
                                        setValue={setValue}
                                        validation={{
                                            required: 'Cattle ID is required',
                                        }}
                                    />
                                    <InputField
                                        label="Method"
                                        name="method"
                                        placeholder="Enter Method"
                                        type="text"
                                        error={errors.method?.message}
                                        registration={register('method')}
                                    />
                                    <InputField
                                        label="Type"
                                        name="type"
                                        placeholder="Enter Type"
                                        type="text"
                                        error={errors.type?.message}
                                        registration={register('type')}
                                    />
                                    <AppSelect
                                        label="Veterinarian "
                                        name="vetId"
                                        placeholder="Select Veterinarian "
                                        options={vetOptions}
                                        error={errors.vetId?.message}
                                        register={register}
                                        setValue={setValue}
                                        validation={{
                                            required: 'Veterinarian  is required',
                                        }}
                                    />
                                      <InputField
                                        label="Date"
                                        name="date"
                                        placeholder="Enter Date"
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

export default AddInseminationRecordModal;
