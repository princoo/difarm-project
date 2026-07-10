import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { InputField } from '@/components/input';
import { registerVeterinarian } from '@/hooks/api/auth';
import { useFarms } from '@/hooks/api/farms';
import toast from 'react-hot-toast';

const AddVeterinarianModal = ({ isOpen, onClose, handleRefetch }: any) => {
    const { farms, fetchFarms } = useFarms({ autoFetch: false });
    const [assignableFarms, setAssignableFarms] = useState<{ id: string; name: string }[]>([]);
    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    useEffect(() => {
        if (!isOpen) return;
        fetchFarms();
    }, [isOpen, fetchFarms]);

    useEffect(() => {
        const list = farms?.data ?? [];
        setAssignableFarms(list);
    }, [farms]);

    const onSubmit = async (data: any) => {
        if (!data.farmId) {
            toast.error('Select a farm to assign this veterinarian.');
            return;
        }
        try {
            await registerVeterinarian(data);
            toast.success('Veterinarian created and assigned to farm. Super admin must activate the account.');
            onClose();
            handleRefetch();
            reset();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to create veterinarian');
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" open={isOpen} onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0" />
                </Transition.Child>
                <div className="fixed inset-0 bg-[black]/60 z-[999] overflow-y-auto">
                    <div className="flex items-start justify-center min-h-screen px-4">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-xl my-8 text-black dark:text-white-dark">
                                <div className="flex bg-[#fbfbfb] dark:bg-[#121c2c] items-center justify-between px-5 py-3">
                                    <div>
                                        <div className="font-bold text-lg">Add Veterinarian Account</div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            Assign to an existing farm. Create the farm first under Farms if needed.
                                        </p>
                                    </div>
                                </div>
                                <div className="p-5">
                                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                        <div>
                                            <label htmlFor="vetFarmId" className="block text-sm font-bold mb-1">
                                                Assign to farm
                                            </label>
                                            <select
                                                id="vetFarmId"
                                                {...register('farmId', { required: 'Farm assignment is required' })}
                                                className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-600"
                                            >
                                                <option value="">Select farm</option>
                                                {assignableFarms.map((f) => (
                                                    <option key={f.id} value={f.id}>{f.name}</option>
                                                ))}
                                            </select>
                                            {assignableFarms.length === 0 && (
                                                <p className="text-xs text-warning mt-1">
                                                    No farms yet. Create a farm under Farms before adding a veterinarian.
                                                </p>
                                            )}
                                            {errors.farmId && (
                                                <p className="text-sm text-red-600 mt-1">{String(errors.farmId.message)}</p>
                                            )}
                                        </div>
                                        <InputField type="text" name="fullname" label="Full name" placeholder="Enter full name" registration={register('fullname', { required: true })} error={errors.fullname?.message} />
                                        <InputField type="text" name="username" label="Username" placeholder="Enter username" registration={register('username', { required: true })} error={errors.username?.message} />
                                        <InputField type="email" name="email" label="Email" placeholder="Enter email" registration={register('email', { required: true })} error={errors.email?.message} />
                                        <InputField type="text" name="phone" label="Phone" placeholder="Enter phone" registration={register('phone')} />
                                        <InputField type="password" name="password" label="Password" placeholder="Enter password" registration={register('password', { required: true, minLength: 8 })} error={errors.password?.message} />
                                        <div className="flex justify-end gap-2">
                                            <button type="button" onClick={onClose} className="btn btn-outline-danger">Cancel</button>
                                            <button type="submit" className="btn btn-primary" disabled={assignableFarms.length === 0}>Create</button>
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

export default AddVeterinarianModal;
