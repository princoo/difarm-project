import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

export default function ConfirmDeleteSupplierModal({
  isOpen,
  onClose,
  onConfirm,
  name,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  name?: string;
}) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" open={isOpen} onClose={onClose} className="relative z-[999]">
        <div className="fixed inset-0 bg-black/60" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-xl bg-white p-6 dark:bg-gray-900">
            <Dialog.Title className="text-lg font-semibold">Delete supplier</Dialog.Title>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Delete {name ? `"${name}"` : 'this supplier'}? This cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="btn btn-outline-primary" onClick={onClose}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={onConfirm}>Delete</button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
}
