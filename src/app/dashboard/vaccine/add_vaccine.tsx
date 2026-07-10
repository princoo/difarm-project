import { z } from 'zod';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { InputField } from '@/components/input';
import AppSelect from '@/components/select/SelectField';
import { useCattle } from '@/hooks/api/cattle';
import { useVeterinarians } from '@/hooks/api/vet';
import { useVaccineRecords } from '@/hooks/api/vaccinr';
import { DocumentArrowUpIcon } from '@heroicons/react/24/outline';

const vaccineRecordSchema = z.object({
    cattleId: z.string().nonempty('Cattle ID is required'),
    date: z.string().nonempty('Date is required'),
    vaccineType: z.string().nonempty('Vaccine type is required'),
    price: z.number().min(0.01, 'Price must be at least 0.01'),
    vetId: z.string().nonempty('Veterinarian ID is required'),
});

interface AddVaccineRecordModalProps {
    isOpen: boolean;
    onClose: () => void;
    handleRefetch: () => void;
}

const AddVaccineRecordModal: React.FC<AddVaccineRecordModalProps> = ({
    isOpen,
    onClose,
    handleRefetch,
}) => {
    const { createVaccineRecord, loading, error } = useVaccineRecords();
    const { cattle, fetchCattle }: any = useCattle();
    const { veterinarians, getVeterinarians }: any = useVeterinarians();
    const [documentFile, setDocumentFile] = useState<File | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
    } = useForm({
        resolver: zodResolver(vaccineRecordSchema),
    });

    useEffect(() => {
        if (!isOpen) {
            setDocumentFile(null);
            reset();
            return;
        }
        fetchCattle('pageSize=10000000');
        getVeterinarians('pageSize=234567876');
    }, [isOpen]);

    const cattleOptions = cattle?.data?.data
    ?.filter((item: any) => item.status !== 'SOLD' && item.status !== 'PROCESSED')
    .map((item: any) => ({
      value: item.id,
      label: item.tagNumber,
    }));
  

    const vetOptions = veterinarians?.data?.data.map((item: any) => ({
        value: item.id,
        label: `${item.name}`,
    }));

    const onSubmit = async (data: any) => {
        try {
            const farmId = localStorage.getItem('FarmId');
            const formData = new FormData();
            formData.append('cattleId', data.cattleId);
            formData.append('date', data.date);
            formData.append('vaccineType', data.vaccineType);
            formData.append('price', String(data.price));
            formData.append('vetId', data.vetId);
            formData.append('farmId', farmId ?? '');
            if (documentFile) {
                formData.append('document', documentFile);
            }
            await createVaccineRecord(formData);
            setDocumentFile(null);
            reset();
            onClose();
            handleRefetch();
        } catch (err) {
            console.error(err);
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
                            <Dialog.Panel className="w-full max-w-md p-6 overflow-hidden text-left mt-4 align-middle transition-all transform bg-white shadow-xl rounded">
                                <Dialog.Title
                                    as="h3"
                                    className="text-lg font-medium leading-6 text-gray-900"
                                >
                                    Add Vaccine Record
                                </Dialog.Title>
                                <form
                                    onSubmit={handleSubmit(onSubmit)}
                                    className="mt-4 grid gap-4"
                                >
                                    <AppSelect
                                        label="Cattle ID"
                                        name="cattleId"
                                        placeholder="Select Cattle ID"
                                        options={cattleOptions}
                                        error={errors.cattleId?.message}
                                        register={register}
                                        setValue={setValue}
                                        validation={{
                                            required: 'Cattle ID is required',
                                        }}
                                    />
                                    <InputField
                                        label="Date"
                                        name="date"
                                        placeholder="Enter Date"
                                        type="date"
                                        error={errors.date?.message}
                                        registration={register('date')}
                                    />
                                    <InputField
                                        label="Vaccine Type"
                                        name="vaccineType"
                                        placeholder="Enter Vaccine Type"
                                        type="text"
                                        error={errors.vaccineType?.message}
                                        registration={register('vaccineType')}
                                    />
                                    <InputField
                                        label="Vaccine price"
                                        name="price"
                                        placeholder="Enter Price"
                                        type="number"
                                        error={errors.price?.message}
                                        registration={register('price', {
                                            valueAsNumber: true,
                                        })}
                                    />
                                    <AppSelect
                                        label="Veterinarian"
                                        name="vetId"
                                        placeholder="Select Veterinarian"
                                        options={vetOptions}
                                        error={errors.vetId?.message}
                                        register={register}
                                        setValue={setValue}
                                        validation={{
                                            required: 'Veterinarian is required',
                                        }}
                                    />
                                    <div>
                                        <label
                                            htmlFor="vaccineDocument"
                                            className="block text-sm font-bold text-gray-700 mb-1"
                                        >
                                            Scanned vaccine document
                                        </label>
                                        <label
                                            htmlFor="vaccineDocument"
                                            className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-gray-300 px-3 py-3 hover:border-primary"
                                        >
                                            <DocumentArrowUpIcon className="h-6 w-6 text-primary shrink-0" />
                                            <span className="text-sm text-gray-600 truncate">
                                                {documentFile
                                                    ? documentFile.name
                                                    : 'Upload PDF or image (JPG, PNG)'}
                                            </span>
                                        </label>
                                        <input
                                            id="vaccineDocument"
                                            type="file"
                                            accept=".pdf,image/jpeg,image/png,image/webp"
                                            className="sr-only"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0] ?? null;
                                                setDocumentFile(file);
                                            }}
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            Optional. Max 8MB. PDF or image of the scanned vaccine form.
                                        </p>
                                    </div>
                                    {error && <p className="text-sm text-red-600">{String(error)}</p>}
                                    <div className="mt-4 flex justify-end space-x-2">
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
                                            disabled={loading}
                                        >
                                            {loading ? 'Adding...' : 'Add'}
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
};

export default AddVaccineRecordModal;
