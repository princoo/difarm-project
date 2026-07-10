import { z } from 'zod';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { InputField } from '@/components/input';
import { useVeterinarians } from '@/hooks/api/vet';

const veterinarianSchema = z.object({
    name: z.string().nonempty('Full name is required'),
  
    email: z.string().nonempty('Email is required').email('Invalid email address'),
    
    phone: z.string().nonempty('Phone is required'),
});

const UpdateVeterinarianModal = ({ isOpen, onClose, vet, handleRefetch }: any) => {
    const { updateVeterinarian, loading, error } = useVeterinarians();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm({
        resolver: zodResolver(veterinarianSchema),
        defaultValues: vet,
    });

    useEffect(() => {
        reset(vet);
    }, [vet, reset]);

    const onSubmit = async (data: any) => {
        try {
            await updateVeterinarian(vet.id, data);
            onClose();
            handleRefetch();
            reset();
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
                            <Dialog.Panel className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-xl my-8 text-black dark:text-white-dark">
                                <div className="flex bg-[#fbfbfb] dark:bg-[#121c2c] items-center justify-between px-5 py-3">
                                    <div className="font-bold text-lg">Update Veterinarian</div>
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
                                                <InputField
                                                    type="text"
                                                    label="Full Name"
                                                    defaultValue={vet?.name}
                                                    placeholder="Enter full name"
                                                    registration={register('name')}
                                                    error={errors.name?.message}
                                                    name="fullname"
                                                />
                                            </div>
                                         
                                            <div className="mb-4">
                                                <InputField
                                                    type="email"
                                                    label="Email"
                                                    defaultValue={vet?.email}
                                                    placeholder="Enter email"
                                                    registration={register('email')}
                                                    error={errors.email?.message}
                                                    name="email"
                                                />
                                            </div>
                                         
                                            <div className="mb-4">
                                                <InputField
                                                    type="text"
                                                    label="Phone"
                                                    defaultValue={vet?.phone}
                                                    placeholder="Enter phone number"
                                                    registration={register('phone')}
                                                    error={errors.phone?.message}
                                                    name="phone"
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

export default UpdateVeterinarianModal;
