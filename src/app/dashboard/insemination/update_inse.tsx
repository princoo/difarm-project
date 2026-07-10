import { z } from 'zod';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { InputField } from '@/components/input';
import { useInseminationRecords } from '@/hooks/api/insemination';
import AppSelect from '@/components/select/SelectField';
import { useVeterinarians } from '@/hooks/api/vet';
import { useCattle } from '@/hooks/api/cattle';

const inseminationSchema = z.object({
    cattleId: z.string().nonempty('Cattle ID is required'),
    method: z.string().nonempty('Method is required'),
    type: z.string().nonempty('Type is required'),
    vetId: z.string().nonempty('Vet ID is required'),
});

const UpdateInseminationModal = ({
    isOpen,
    onClose,
    insemination,
    handleRefetch,
}: any) => {
    const { updateInseminationRecord, loading, error } =
        useInseminationRecords();

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
        reset,
    } = useForm({
        resolver: zodResolver(inseminationSchema),
        defaultValues: insemination,
    });
    const { cattle, fetchCattle }: any = useCattle();
    const { veterinarians, getVeterinarians }: any = useVeterinarians();

    useEffect(() => {
        fetchCattle();
        getVeterinarians();
    }, []);
    useEffect(() => {
        reset(insemination);
    }, [insemination, reset]);

    const onSubmit = async (data: any) => {
        try {
            await updateInseminationRecord(insemination.id, data);
            onClose();
            handleRefetch();
            reset();
        } catch (err) {}
    };

    const cattleOptions = cattle?.data?.data?.map((item: any) => ({
        value: item.id,
        label: item.tagNumber,
    }));

    const vetOptions = veterinarians?.data?.data?.map((item: any) => ({
        value: item.id,
        label: `${item.name}`,
    }));

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
                            <Dialog.Panel className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-xl my-8 text-black dark:text-white-dark">
                                <div className="flex bg-[#fbfbfb] dark:bg-[#121c2c] items-center justify-between px-5 py-3">
                                    <div className="font-bold text-lg">
                                        Update Insemination
                                    </div>
                                </div>
                                <div className="p-5">
                                    {error && (
                                        <div className="text-red-500">
                                            {error}
                                        </div>
                                    )}
                                    <form onSubmit={handleSubmit(onSubmit)}>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="mb-4">
                                            <AppSelect
                                                    label="Cattle "
                                                    name="cattleId"
                                                    placeholder="Select Cattle "
                                                    options={cattleOptions}
                                                    error={
                                                        errors.cattleId?.message
                                                    }
                                                    defaultValue={{
                                                        label: `${insemination?.cattle?.tagNumber}(${insemination?.cattle?.breed}) `,
                                                        value: insemination?.cattle?.id,
                                                    }}
                                                    register={register}
                                                    setValue={setValue}
                                                    validation={{
                                                        required:
                                                            'Cattle  is required',
                                                    }}
                                                />
                                            </div>

                                            <div className="mb-4">
                                                <InputField
                                                    type="text"
                                                    label="Method"
                                                    defaultValue={
                                                        insemination?.method
                                                    }
                                                    placeholder="Enter method"
                                                    registration={register(
                                                        'method'
                                                    )}
                                                    error={
                                                        errors.method?.message
                                                    }
                                                    name="method"
                                                />
                                            </div>
                                            <div className="mb-4">
                                                <InputField
                                                    type="text"
                                                    label="Type"
                                                    defaultValue={
                                                        insemination?.type
                                                    }
                                                    placeholder="Enter type"
                                                    registration={register(
                                                        'type'
                                                    )}
                                                    error={errors.type?.message}
                                                    name="type"
                                                />
                                            </div>
                                            <div className="mb-4">
                                                <AppSelect
                                                    label="Veterinarian"
                                                    name="vetId"
                                                    placeholder="Select Veterinarian"
                                                    options={vetOptions}
                                                    error={
                                                        errors.vetId?.message
                                                    }
                                                    defaultValue={{
                                                        label: `${insemination?.veterinarian?.name} `,
                                                        value: insemination?.veterinarian?.id,
                                                    }}
                                                    register={register}
                                                    setValue={setValue}
                                                    validation={{
                                                        required:
                                                            'Veterinarian  is required',
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end items-center mt-8">
                                            <button
                                                type="button"
                                                onClick={onClose}
                                                className="btn btn-outline-danger"
                                            >
                                                Discard
                                            </button>
                                            <button
                                                type="submit"
                                                className="btn btn-primary ltr:ml-4 rtl:mr-4"
                                                disabled={loading}
                                            >
                                                {loading ? 'Saving...' : 'Save'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default UpdateInseminationModal;
