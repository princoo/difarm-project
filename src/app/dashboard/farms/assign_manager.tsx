import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';
import { useFetchUsers } from '@/hooks/api/auth';
import { assignFarmManager } from '@/hooks/api/farms';
import toast from 'react-hot-toast';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  farm: any;
  handleRefetch?: () => void;
};

export default function AssignManagerModal({
  isOpen,
  onClose,
  farm,
  handleRefetch,
}: Props) {
  const { users, fetchUsers, loading: usersLoading }: any = useFetchUsers();
  const [managerId, setManagerId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsers({ role: 'MANAGER' });
      const current =
        farm?.managerId ||
        farm?.managerLinks?.[0]?.userId ||
        farm?.managerLinks?.[0]?.user?.id ||
        '';
      setManagerId(current || '');
    }
  }, [isOpen, farm]);

  const managers = (users?.data?.data ?? []).filter(
    (u: any) => u?.account?.role === 'MANAGER' || u?.role === 'MANAGER'
  );

  const currentName =
    farm?.manager?.fullname ||
    farm?.managerLinks?.find((l: any) => l.userId === farm?.managerId)?.user
      ?.fullname ||
    farm?.managerLinks?.[0]?.user?.fullname;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farm?.id) return;
    if (!managerId) {
      toast.error('Select a farm manager.');
      return;
    }
    setSaving(true);
    try {
      await assignFarmManager(farm.id, managerId);
      handleRefetch?.();
      onClose();
    } catch {
      // toast from helper
    } finally {
      setSaving(false);
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
              <Dialog.Panel className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-md my-8 text-black dark:text-white-dark">
                <div className="flex bg-[#fbfbfb] dark:bg-[#121c2c] items-center justify-between px-5 py-3">
                  <div className="font-bold text-lg">Assign farm manager</div>
                </div>
                <form onSubmit={onSubmit} className="p-5 space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Farm: <span className="font-semibold">{farm?.name || '—'}</span>
                  </p>
                  {currentName && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Current manager:{' '}
                      <span className="font-semibold">{currentName}</span>
                    </p>
                  )}
                  {!farm?.status && (
                    <p className="text-sm text-amber-700 dark:text-amber-300 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:bg-amber-900/20 dark:border-amber-800">
                      Farm must be activated before managers can work on it.
                      Super admin can still assign; activation may still be
                      required for the manager to access the farm.
                    </p>
                  )}
                  <div>
                    <label
                      htmlFor="managerId"
                      className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Manager
                    </label>
                    <select
                      id="managerId"
                      value={managerId}
                      onChange={(e) => setManagerId(e.target.value)}
                      className="form-select w-full"
                      disabled={usersLoading}
                    >
                      <option value="">
                        {usersLoading ? 'Loading…' : 'Select manager'}
                      </option>
                      {managers.map((u: any) => (
                        <option key={u.id} value={u.id}>
                          {u.fullname ||
                            u.account?.username ||
                            u.account?.email ||
                            u.id}
                        </option>
                      ))}
                    </select>
                    {managers.length === 0 && !usersLoading && (
                      <p className="mt-1 text-xs text-gray-500">
                        No manager users found. Create a manager from Users
                        first.
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
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
                      disabled={saving || !managerId}
                    >
                      {saving ? 'Saving…' : 'Assign manager'}
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
}
