import { z } from 'zod';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { InputField } from '@/components/input';
import AppSelect from '@/components/select/SelectField';
import { useCattle } from '@/hooks/api/cattle';
import { useLivestock } from '@/hooks/api/livestock';
import { useVeterinarians } from '@/hooks/api/vet';
import { useVaccineRecords } from '@/hooks/api/vaccinr';
import { useSelectedFarmId } from '@/hooks/useSelectedFarmId';
import { getFarmId } from '@/utils/farmId';
import { DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import {
    ANIMAL_TYPE_OPTIONS,
    ANIMAL_TYPE_VALUES,
    animalPayloadKey,
    animalTypeLabel,
    buildAnimalOptions,
} from '../health/animalRef';

const vaccineRecordSchema = z.object({
        animalType: z.enum(ANIMAL_TYPE_VALUES),
        animalId: z.string().nonempty('Select the animal'),
        date: z.string().nonempty('Date is required'),
        vaccineType: z.string().nonempty('Vaccine name is required'),
        diseaseName: z.string().nonempty('Disease name is required'),
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
    const { cattle, fetchCattleOnSelectedFarm }: any = useCattle();
    const { allLivestock, fetchLivestockOnSelectedFarm } = useLivestock();
    const selectedFarmId = useSelectedFarmId(isOpen);
    const { veterinarians, getVeterinarians }: any = useVeterinarians();
    const [documentFile, setDocumentFile] = useState<File | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch,
    } = useForm({
        resolver: zodResolver(vaccineRecordSchema),
        defaultValues: { animalType: 'CATTLE' as const, animalId: '' },
    });

    const animalType = watch('animalType') ?? 'CATTLE';

    useEffect(() => {
        if (!isOpen) {
            setDocumentFile(null);
            reset();
            return;
        }
        if (!selectedFarmId) return;
        fetchCattleOnSelectedFarm('pageSize=10000000');
        fetchLivestockOnSelectedFarm();
        getVeterinarians('pageSize=234567876');
    }, [isOpen, selectedFarmId]);

    // Each type has its own list — clear the tag when the type changes.
    useEffect(() => {
        setValue('animalId', '');
    }, [animalType, setValue]);

    const animalOptions = buildAnimalOptions(
        animalType,
        cattle?.data?.data,
        allLivestock?.data?.data
    );


    const vetOptions = veterinarians?.data?.data.map((item: any) => ({
        value: item.id,
        label: `${item.name}`,
    }));

    const onSubmit = async (data: any) => {
        try {
            const farmId = getFarmId();
            if (!farmId) {
                toast.error('Select a farm before recording a vaccination.');
                return;
            }
            const formData = new FormData();
            formData.append(animalPayloadKey(data.animalType), data.animalId);
            formData.append('date', data.date);
            formData.append('vaccineType', data.vaccineType);
            formData.append('diseaseName', data.diseaseName);
            formData.append('price', String(data.price));
            formData.append('vetId', data.vetId);
            formData.append('farmId', farmId);
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
                            <Dialog.Panel className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-2xl my-8 text-black dark:text-white-dark">
                                <div className="flex bg-[#fbfbfb] dark:bg-[#121c2c] items-center justify-center px-5 py-3">
                                    <Dialog.Title
                                        as="h3"
                                        className="font-bold text-lg text-center"
                                    >
                                        Add Vaccine Record
                                    </Dialog.Title>
                                </div>
                                <div className="p-5">
                                {!selectedFarmId && (
                                    <p className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                                        Select a farm first — health records belong to one farm only.
                                    </p>
                                )}
                                <form
                                    onSubmit={handleSubmit(onSubmit)}
                                    className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1"
                                >
                                    <AppSelect
                                        label="Animal type"
                                        name="animalType"
                                        placeholder="Select animal type"
                                        options={ANIMAL_TYPE_OPTIONS}
                                        defaultValue={ANIMAL_TYPE_OPTIONS[0]}
                                        error={errors.animalType?.message}
                                        register={register}
                                        setValue={setValue}
                                    />
                                    <AppSelect
                                        key={animalType}
                                        label={`${animalTypeLabel(animalType)} tag`}
                                        name="animalId"
                                        placeholder={`Select ${animalTypeLabel(animalType).toLowerCase()}`}
                                        options={animalOptions}
                                        error={errors.animalId?.message}
                                        register={register}
                                        setValue={setValue}
                                        validation={{
                                            required: 'Select the animal',
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
                                        label="Vaccine Name"
                                        name="vaccineType"
                                        placeholder="Enter vaccine name"
                                        type="text"
                                        error={errors.vaccineType?.message}
                                        registration={register('vaccineType')}
                                    />
                                    <InputField
                                        label="Disease vaccinated for"
                                        name="diseaseName"
                                        placeholder="Enter disease name"
                                        type="text"
                                        error={errors.diseaseName?.message}
                                        registration={register('diseaseName')}
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
                                            className="block text-sm font-bold text-gray-700 dark:text-white-dark mb-1"
                                        >
                                            Scanned vaccine document
                                        </label>
                                        <label
                                            htmlFor="vaccineDocument"
                                            className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 px-3 py-3 hover:border-primary"
                                        >
                                            <DocumentArrowUpIcon className="h-6 w-6 text-primary shrink-0" />
                                            <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
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
                                    {error && (
                                        <p className="sm:col-span-2 text-sm text-red-600">
                                            {String(error)}
                                        </p>
                                    )}
                                    <div className="sm:col-span-2 flex justify-end gap-2 mt-4">
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
                                            disabled={loading || !selectedFarmId}
                                        >
                                            {loading ? 'Adding...' : 'Add'}
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

export default AddVaccineRecordModal;
