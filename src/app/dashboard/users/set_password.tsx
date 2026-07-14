import { z } from 'zod';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { InputField } from '@/components/input';
import { api } from '@/hooks/api';
import toast from 'react-hot-toast';

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, 'Include at least one letter and one number'),
    confirmPassword: z.string().min(1, 'Confirm the new password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type Props = {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  handleRefetch?: () => void;
};

const SetPasswordModal = ({ isOpen, onClose, user }: Props) => {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (isOpen) {
      reset({ password: '', confirmPassword: '' });
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: z.infer<typeof passwordSchema>) => {
    if (!user?.id) return;
    setLoading(true);
    try {
      await api.put(`/users/${user.id}/password`, {
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      toast.success('Password updated successfully');
      onClose();
      reset();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error?.[0] ||
          'Failed to update password'
      );
    } finally {
      setLoading(false);
    }
  };

  const name =
    user?.fullname || user?.account?.username || user?.account?.email || 'this user';

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
              <Dialog.Panel className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-md my-8 text-black dark:text-white-dark">
                <div className="flex bg-[#fbfbfb] dark:bg-[#121c2c] items-center justify-between px-5 py-3">
                  <div className="font-bold text-lg">Set new password</div>
                </div>
                <div className="p-5">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Set a temporary password for <span className="font-semibold">{name}</span>.
                    Share it securely and ask them to change it after login if needed.
                  </p>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                    <InputField
                      type="password"
                      label="New password"
                      placeholder="At least 8 characters"
                      registration={register('password')}
                      error={errors.password?.message}
                      name="password"
                      autoComplete="new-password"
                    />
                    <InputField
                      type="password"
                      label="Confirm password"
                      placeholder="Repeat new password"
                      registration={register('confirmPassword')}
                      error={errors.confirmPassword?.message}
                      name="confirmPassword"
                      autoComplete="new-password"
                    />
                    <div className="flex justify-end items-center mt-6 gap-2">
                      <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-outline-danger"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                      >
                        {loading ? 'Saving…' : 'Save password'}
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

export default SetPasswordModal;
