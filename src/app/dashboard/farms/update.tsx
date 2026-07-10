
import { z } from 'zod';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { InputField } from '@/components/input';
import { useFetchUsers } from '@/hooks/api/auth';
import { useUpdateFarm } from '@/hooks/api/farms';

const farmSchema = z.object({
    name: z.string().nonempty('Name is required'),
    location: z.string().nonempty('Location is required'),
    size: z.number().min(0.01, 'Size must be at least 0.01'),
    // size: z.string().nonempty('Size is required'),
    type: z.string().nonempty('Type is required'),
    ownerId: z.string().nonempty('Owner ID is required'),
});

const UpdateFarmModal = ({ isOpen, onClose, farm, handleRefetch }: any) => {
    const { updateFarm, loading, error } = useUpdateFarm();
    const { users, loading: usersLoading, error: usersError, fetchUsers }: any = useFetchUsers();

    useEffect(() => {
        fetchUsers();
    }, []);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue
    } = useForm({
        resolver: zodResolver(farmSchema),
    });

    useEffect(() => {
        if (farm) {
            setValue("name", farm.name);
            setValue("location", farm.location);
            setValue("size", farm.size);
            setValue("type", farm.type);
            setValue("ownerId", farm.ownerId);
        }
    }, [farm, setValue]);

    const onSubmit = async (data: any) => {
        try {
            const payload = {
                name: data.name,
                location: data.location,
                size: parseFloat(data.size),
                type: data.type,
                ownerId: data.ownerId,
            }
            await updateFarm(farm.id, payload);
            onClose();
            handleRefetch();
            reset();
        } catch (err) {
            // Handle error if needed
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
                            <Dialog.Panel className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-lg my-8 text-black dark:text-white-dark">
                                <div className="flex bg-[#fbfbfb] dark:bg-[#121c2c] items-center justify-between px-5 py-3">
                                    <div className="font-bold text-lg">
                                        Update Farm
                                    </div>
                                </div>
                                <div className="p-5">
                                    {error && (
                                        <div className="text-red-500">
                                            {error}
                                        </div>
                                    )}
                                    {usersError && (
                                        <div className="text-red-500">
                                            {usersError}
                                        </div>
                                    )}
                                    <form onSubmit={handleSubmit(onSubmit)}>
                                        <div className="mb-4">
                                            <InputField
                                                type="text"
                                                label="Name"
                                                placeholder="Enter farm name"
                                                registration={register('name')}
                                                error={errors.name?.message}
                                                name={'name'}
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <InputField
                                                type="text"
                                                name='location'
                                                label="Location"
                                                placeholder="Enter farm location"
                                                registration={register('location')}
                                                error={errors.location?.message}
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <InputField
                                                type="number"
                                                label="Size"
                                                name="size"
                                                registration={register('size')}
                                                placeholder="Enter farm size"
                                                error={errors.size?.message}
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <InputField
                                                type="text"
                                                registration={register('type')}
                                                label="Type"
                                                placeholder="Enter farm type"
                                                name="type"
                                                error={errors.type?.message}
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label htmlFor="ownerId" className="block text-sm font-bold text-gray-700">
                                                Owner ID
                                            </label>
                                            <select
                                                id="ownerId"
                                                {...register('ownerId')}
                                                
                                                className="mt-1 block w-full px-3 py-2 border text-gray-400 border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm pr-10"
                                            >
                                                <option value="">Select Owner</option>
                                                {usersLoading ? (
                                                    <option>Loading...</option>
                                                ) : (
                                                    users?.data?.data.map((user: any) => (
                                                        <option key={user.id} value={user.id}>
                                                            {user.fullname}
                                                        </option>
                                                    ))
                                                )}
                                            </select>
                                            {errors.ownerId && (
                                                <p className="text-sm text-red-600">Owner is required</p>
                                            )}
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

export default UpdateFarmModal;
