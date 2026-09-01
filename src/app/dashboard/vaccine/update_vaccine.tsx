import { z } from 'zod';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { InputField } from '@/components/input';
import { useVaccineRecords } from '@/hooks/api/vaccinr';
import AppSelect from '@/components/select/SelectField';
import { useCattle } from '@/hooks/api/cattle';
import { useLivestock } from '@/hooks/api/livestock';
import { useVeterinarians } from '@/hooks/api/vet';
import { useSelectedFarmId } from '@/hooks/useSelectedFarmId';
import { DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import {
    ANIMAL_TYPE_OPTIONS,
    ANIMAL_TYPE_VALUES,
    animalPayloadKey,
    animalTypeLabel,
    animalTypeOf,
    buildAnimalOptions,
} from '../health/animalRef';

const vaccineSchema = z.object({
    animalType: z.enum(ANIMAL_TYPE_VALUES),
    animalId: z.string().nonempty('Select the animal'),
    vaccineType: z.string().nonempty('Vaccine name is required'),
    diseaseName: z.string().nonempty('Disease name is required'),
    price: z.number().min(0.01, 'Price must be at least 0.01').optional(),
    vetId: z.string().nonempty('Vet ID is required'),
    date: z.string().nonempty('Date is required'),
});

const UpdateVaccineModal = ({
    isOpen,
    onClose,
    vaccine,
    handleRefetch,
}: any) => {
    const { updateVaccineRecord, loading, error } = useVaccineRecords();
    const [documentFile, setDocumentFile] = useState<File | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch,
    } = useForm({
        resolver: zodResolver(vaccineSchema),
        defaultValues: vaccine,
    });

    const recordType = animalTypeOf(vaccine);
    const animalType = watch('animalType') ?? recordType;

    useEffect(() => {
        if (!isOpen) {
            setDocumentFile(null);
            return;
        }
        reset({
            animalType: recordType,
            animalId:
                recordType === 'CATTLE'
                    ? vaccine?.cattleId ?? vaccine?.cattle?.id
                    : vaccine?.livestockId ?? vaccine?.livestock?.id,
            vaccineType: vaccine?.vaccineType,
            diseaseName: vaccine?.diseaseName || '',
            price: vaccine?.price,
            vetId: vaccine?.vetId ?? vaccine?.veterinarian?.id,
            date: vaccine?.date ? String(vaccine.date).slice(0, 10) : '',
        });
    }, [vaccine, reset, isOpen]);

    const onSubmit = async (data: any) => {
        try {
            const formData = new FormData();
            formData.append(animalPayloadKey(data.animalType), data.animalId);
            formData.append('date', data.date);
            formData.append('vaccineType', data.vaccineType);
            formData.append('diseaseName', data.diseaseName);
            formData.append('vetId', data.vetId);
            if (data.price !== undefined && data.price !== null && !Number.isNaN(data.price)) {
                formData.append('price', String(data.price));
            }
            if (documentFile) {
                formData.append('document', documentFile);
            }
            await updateVaccineRecord(vaccine.id, formData);
            setDocumentFile(null);
            onClose();
            handleRefetch();
            reset();
        } catch (err) {}
    };
    const { cattle, fetchCattleOnSelectedFarm }: any = useCattle();
    const { allLivestock, fetchLivestockOnSelectedFarm } = useLivestock();
    const { veterinarians, getVeterinarians }: any = useVeterinarians();
    const selectedFarmId = useSelectedFarmId(isOpen);
    useEffect(() => {
        if (!isOpen || !selectedFarmId) return;
        fetchCattleOnSelectedFarm('pageSize=20000000');
        fetchLivestockOnSelectedFarm();
        getVeterinarians('pageSize=1000000');
    }, [isOpen, selectedFarmId]);

    const animalOptions = buildAnimalOptions(
        animalType,
        cattle?.data?.data,
        allLivestock?.data?.data
    );

    // Only prefill the picker when the record still points at the same type.
    const animalDefaultValue = useMemo(() => {
        if (animalType !== recordType) return undefined;
        if (recordType === 'CATTLE') {
            return vaccine?.cattle
                ? {
                      label: `${vaccine.cattle.tagNumber}(${vaccine.cattle.breed})`,
                      value: vaccine.cattle.id,
                  }
                : undefined;
        }
        return vaccine?.livestock
            ? {
                  label: String(vaccine.livestock.tagNumber),
                  value: vaccine.livestock.id,
              }
            : undefined;
    }, [animalType, recordType, vaccine]);

    const typeDefaultValue = useMemo(
        () => ANIMAL_TYPE_OPTIONS.find((o) => o.value === recordType),
        [recordType]
    );

    // Switching type invalidates the previously selected tag.
    useEffect(() => {
        if (animalType && animalType !== recordType) {
            setValue('animalId', '');
        }
    }, [animalType, recordType, setValue]);

    const vetOptions = veterinarians?.data?.data.map((item: any) => ({
        value: item.id,
        label: `${item.name}`,
    }));
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
                                    <div className="font-bold text-lg text-center">
                                        Update Vaccine
                                    </div>
                                </div>
                                <div className="p-5">
                                    {error && (
                                        <div className="text-red-500 mb-3">
                                            {error}
                                        </div>
                                    )}
                                    <form onSubmit={handleSubmit(onSubmit)}>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                                            <AppSelect
                                                label="Animal type"
                                                name="animalType"
                                                placeholder="Select animal type"
                                                options={ANIMAL_TYPE_OPTIONS}
                                                defaultValue={typeDefaultValue}
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
                                                defaultValue={animalDefaultValue}
                                                register={register}
                                                setValue={setValue}
                                                validation={{
                                                    required: 'Select the animal',
                                                }}
                                            />
                                            <InputField
                                                type="date"
                                                label="Date"
                                                name="date"
                                                registration={register('date')}
                                                error={errors.date?.message}
                                            />
                                            <InputField
                                                type="text"
                                                label="Vaccine Name"
                                                defaultValue={vaccine?.vaccineType}
                                                placeholder="Enter vaccine name"
                                                registration={register('vaccineType')}
                                                error={errors.vaccineType?.message}
                                                name="vaccineType"
                                            />
                                            <InputField
                                                type="text"
                                                label="Disease vaccinated for"
                                                defaultValue={vaccine?.diseaseName}
                                                placeholder="Enter disease name"
                                                registration={register('diseaseName')}
                                                error={errors.diseaseName?.message}
                                                name="diseaseName"
                                            />
                                            <InputField
                                                label="Vaccine price"
                                                name="price"
                                                placeholder="Enter Price"
                                                type="number"
                                                defaultValue={vaccine?.price}
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
                                                defaultValue={
                                                    vaccine?.veterinarian
                                                        ? {
                                                              label: `${vaccine.veterinarian.name}`,
                                                              value: vaccine.veterinarian.id,
                                                          }
                                                        : undefined
                                                }
                                                register={register}
                                                setValue={setValue}
                                                validation={{
                                                    required: 'Veterinarian is required',
                                                }}
                                            />
                                            <div>
                                                <label
                                                    htmlFor="updateVaccineDocument"
                                                    className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1"
                                                >
                                                    Scanned vaccine document
                                                </label>
                                                <label
                                                    htmlFor="updateVaccineDocument"
                                                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 px-3 py-3 hover:border-primary"
                                                >
                                                    <DocumentArrowUpIcon className="h-6 w-6 text-primary shrink-0" />
                                                    <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                                        {documentFile
                                                            ? documentFile.name
                                                            : vaccine?.documentName
                                                              ? `Current: ${vaccine.documentName} (choose file to replace)`
                                                              : 'Upload PDF or image (JPG, PNG)'}
                                                    </span>
                                                </label>
                                                <input
                                                    id="updateVaccineDocument"
                                                    type="file"
                                                    accept=".pdf,image/jpeg,image/png,image/webp"
                                                    className="sr-only"
                                                    onChange={(e) => {
                                                        setDocumentFile(e.target.files?.[0] ?? null);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end items-center gap-2 mt-6">
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

export default UpdateVaccineModal;
