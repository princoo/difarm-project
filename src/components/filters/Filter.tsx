import React from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import { useState, Fragment } from 'react';
import { FunnelIcon } from '@heroicons/react/24/outline';
function Filter({ title, children, name, resetFilters }: any) {
    const [modal1, setModal1] = useState(false);
    return (
        <div className="">
            <div className="flex items-center justify-center">
                <button type="button" onClick={() => setModal1(true)} className="btn btn-primary btn-sm m-1">
                    <FunnelIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                    FILTER
                </button>
            </div>
            <Transition appear show={modal1} as={Fragment}>
                <Dialog as="div" open={modal1} onClose={() => setModal1(false)}>
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
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
                                <Dialog.Panel as="div" className="panel border-0 p-0 rounded-lg overflow-hidden my-8 w-full max-w-lg text-black dark:text-white-dark">
                                    <div className="flex bg-[#fbfbfb] dark:bg-[#121c2c] items-center justify-between px-5 py-3">
                                        <div className="text-lg flex flex-row justify-center w-full ">{title}</div>
                                    </div>
                                    <div className="p-5">
                                        {children}
                                        <div className="flex justify-end items-center mt-8">
                                            <button
                                                type="button"
                                                className="btn btn-outline-danger"
                                                onClick={() => {
                                                  resetFilters();
                                                    setModal1(false);
                                                
                                                }}
                                            >
                                                Discard
                                            </button>
                                            <button type="button" className="btn btn-primary ltr:ml-4 rtl:mr-4" onClick={() => setModal1(false)}>
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
}

export default Filter;
