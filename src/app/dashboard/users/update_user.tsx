import { z } from 'zod';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { InputField } from '@/components/input';
import { useUsers } from '@/hooks/api/auth';
import toast from 'react-hot-toast';

const userSchema = z.object({
  fullname: z.string().min(1, 'Full name is required'),
  username: z.string().min(1, 'Username is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  gender: z.string().min(1, 'Gender is required'),
  phone: z.string().min(1, 'Phone is required'),
});

type FormValues = z.infer<typeof userSchema>;

const UpdateUserModal = ({ isOpen, onClose, user, handleRefetch }: any) => {
  const { updateUser, loading, error } = useUsers();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      fullname: '',
      username: '',
      email: '',
      gender: '',
      phone: '',
    },
  });

  useEffect(() => {
    if (!isOpen || !user) return;
    reset({
      fullname: user.fullname ?? '',
      username: user.account?.username ?? '',
      email: user.account?.email ?? '',
      gender: user.gender ?? '',
      phone: user.account?.phone ?? '',
    });
  }, [isOpen, user, reset]);

  const onSubmit = async (data: FormValues) => {
    if (!user?.id) return;
    try {
      await updateUser(user.id, data);
      toast.success('User updated successfully');
      onClose();
      handleRefetch?.();
    } catch {
      // toast/error set in hook
    }
  };

  const errorMessage =
    typeof error === 'string'
      ? error
      : (error as any)?.response?.data?.error ||
        (error as any)?.response?.data?.message ||
        null;

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
                  <div className="font-bold text-lg">Update User</div>
                </div>
                <div className="p-5">
                  {errorMessage && (
                    <div className="mb-3 text-sm text-red-500">{errorMessage}</div>
                  )}
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="mb-4">
                        <InputField
                          type="text"
                          label="Full Name"
                          placeholder="Enter full name"
                          registration={register('fullname')}
                          error={errors.fullname?.message}
                          name="fullname"
                        />
                      </div>
                      <div className="mb-4">
                        <InputField
                          type="text"
                          label="Username"
                          placeholder="Enter username"
                          registration={register('username')}
                          error={errors.username?.message}
                          name="username"
                        />
                      </div>
                      <div className="mb-4">
                        <InputField
                          type="email"
                          label="Email"
                          placeholder="Enter email"
                          registration={register('email')}
                          error={errors.email?.message}
                          name="email"
                        />
                      </div>
                      <div className="mb-4">
                        <label
                          htmlFor="gender"
                          className="block text-sm font-bold text-gray-700"
                        >
                          Gender
                        </label>
                        <select
                          id="gender"
                          {...register('gender')}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                          <option value="">Select Gender</option>
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                        </select>
                        {errors.gender && (
                          <p className="mt-2 text-sm text-red-600">
                            {errors.gender.message}
                          </p>
                        )}
                      </div>
                      <div className="mb-4">
                        <InputField
                          type="text"
                          label="Phone"
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

export default UpdateUserModal;
