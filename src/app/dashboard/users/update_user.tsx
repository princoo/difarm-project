import { z } from 'zod';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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

const fieldClass =
  'mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm bg-white dark:bg-gray-900';

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
    if (!isOpen || !user?.id) return;
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
      await updateUser(user.id, {
        fullname: data.fullname.trim(),
        username: data.username.trim(),
        email: data.email.trim(),
        gender: data.gender,
        phone: String(data.phone).trim(),
      });
      toast.success('User updated successfully');
      await Promise.resolve(handleRefetch?.());
      onClose();
    } catch {
      // toast/error set in hook
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
              <Dialog.Panel className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-xl my-8 text-black dark:text-white-dark">
                <div className="flex bg-[#fbfbfb] dark:bg-[#121c2c] items-center justify-between px-5 py-3">
                  <div className="font-bold text-lg">Update User</div>
                </div>
                <div className="p-5">
                  {error && (
                    <div className="mb-3 text-sm text-red-500">{error}</div>
                  )}
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-bold">Full Name</label>
                        <input
                          type="text"
                          className={fieldClass}
                          {...register('fullname')}
                        />
                        {errors.fullname && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.fullname.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-bold">Username</label>
                        <input
                          type="text"
                          className={fieldClass}
                          {...register('username')}
                        />
                        {errors.username && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.username.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-bold">Email</label>
                        <input
                          type="email"
                          className={fieldClass}
                          {...register('email')}
                        />
                        {errors.email && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.email.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-bold">Gender</label>
                        <select className={fieldClass} {...register('gender')}>
                          <option value="">Select Gender</option>
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                        </select>
                        {errors.gender && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.gender.message}
                          </p>
                        )}
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-bold">Phone</label>
                        <input
                          type="text"
                          className={fieldClass}
                          {...register('phone')}
                        />
                        {errors.phone && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.phone.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end items-center mt-8 gap-3">
                      <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-outline-danger"
                      >
                        Discard
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
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
