import { Fragment, useEffect } from "react";
import { z } from "zod";
import { Dialog, Transition } from "@headlessui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { InputField } from "@/components/input";
import { useLivestock, type LivestockRow } from "@/hooks/api/livestock";
import { getFarmId } from "@/utils/farmId";
import {
  LIVESTOCK_SPECIES,
  genderLabel,
  speciesLabel,
} from "./livestockMeta";

const livestockSchema = z.object({
  tagNumber: z
    .string()
    .trim()
    .min(2, "Tag number must be at least 2 characters"),
  species: z.enum(["GOAT", "SHEEP", "PIG", "POULTRY", "RABBIT", "OTHER"], {
    message: "Species is required",
  }),
  gender: z.enum(["MALE", "FEMALE"], { message: "Gender is required" }),
  breed: z.string().optional(),
  weight: z.string().optional(),
  DOB: z.string().optional(),
  location: z.string().optional(),
  motherTag: z.string().optional(),
});

type LivestockFormValues = z.infer<typeof livestockSchema>;

const emptyValues: LivestockFormValues = {
  tagNumber: "",
  species: "GOAT",
  gender: "FEMALE",
  breed: "",
  weight: "",
  DOB: "",
  location: "",
  motherTag: "",
};

const toDateInput = (value?: string | null) =>
  value ? String(value).slice(0, 10) : "";

const numberOrNull = (value?: string) => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

const isoOrNull = (value?: string) => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  handleRefetch: () => void;
  /** Present when editing; omitted when recording a new animal. */
  animal?: LivestockRow | null;
};

const LivestockFormModal = ({
  isOpen,
  onClose,
  handleRefetch,
  animal,
}: Props) => {
  const { addLivestock, updateLivestock, loading } = useLivestock();
  const isEdit = Boolean(animal?.id);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<LivestockFormValues>({
    resolver: zodResolver(livestockSchema),
    defaultValues: emptyValues,
  });

  const species = watch("species");
  const gender = watch("gender");

  useEffect(() => {
    if (!isOpen) return;
    if (animal) {
      reset({
        tagNumber: animal.tagNumber ?? "",
        species: animal.species ?? "GOAT",
        gender: animal.gender ?? "FEMALE",
        breed: animal.breed ?? "",
        weight: animal.weight != null ? String(animal.weight) : "",
        DOB: toDateInput(animal.DOB),
        location: animal.location ?? "",
        motherTag: animal.motherTag ?? "",
      });
    } else {
      reset(emptyValues);
    }
  }, [isOpen, animal, reset]);

  const onInvalid = (formErrors: typeof errors) => {
    const first = Object.values(formErrors)[0]?.message;
    toast.error(
      typeof first === "string"
        ? first
        : "Please fix the highlighted fields before saving."
    );
  };

  const onSubmit = async (data: LivestockFormValues) => {
    const farmId = animal?.farmId || getFarmId();
    if (!farmId) {
      toast.error("No farm selected. Choose a farm first.");
      return;
    }

    const payload = {
      farmId,
      tagNumber: data.tagNumber.trim(),
      species: data.species,
      gender: data.gender,
      breed: data.breed?.trim() || null,
      weight: numberOrNull(data.weight),
      DOB: isoOrNull(data.DOB),
      location: data.location?.trim() || null,
      motherTag: data.motherTag?.trim() || null,
    };

    const saved = isEdit
      ? await updateLivestock(animal!.id, payload)
      : await addLivestock(payload);

    if (saved) {
      handleRefetch();
      onClose();
      reset(emptyValues);
    }
  };

  const selectClass =
    "block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm";
  const labelClass = "block text-sm font-bold text-gray-700 dark:text-white-dark";
  // Mirrors the InputField wrapper so selects and inputs share the same rhythm.
  const fieldWrapClass = "my-2";

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
                    {isEdit
                      ? `Edit ${speciesLabel(animal?.species)} record`
                      : "Record other animal"}
                  </div>
                </div>
                <div className="p-5">
                  <form
                    onSubmit={handleSubmit(onSubmit, onInvalid)}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-x-4"
                  >
                    <div className={fieldWrapClass}>
                      <label htmlFor="species" className={labelClass}>
                        Species
                      </label>
                      <select
                        id="species"
                        {...register("species")}
                        className={selectClass}
                      >
                        {LIVESTOCK_SPECIES.map((s) => (
                          <option key={s} value={s}>
                            {speciesLabel(s)}
                          </option>
                        ))}
                      </select>
                      {errors.species && (
                        <p className="text-sm text-red-600">
                          {errors.species.message}
                        </p>
                      )}
                    </div>

                    <InputField
                      type="text"
                      name="tagNumber"
                      label="Tag number"
                      placeholder="e.g. GOAT-014"
                      registration={register("tagNumber")}
                      error={errors.tagNumber?.message}
                    />

                    <div className={fieldWrapClass}>
                      <label htmlFor="gender" className={labelClass}>
                        Sex
                      </label>
                      <select
                        id="gender"
                        {...register("gender")}
                        className={selectClass}
                      >
                        <option value="FEMALE">
                          {genderLabel("FEMALE", species)}
                        </option>
                        <option value="MALE">
                          {genderLabel("MALE", species)}
                        </option>
                      </select>
                    </div>

                    <InputField
                      type="text"
                      name="breed"
                      label="Breed (optional)"
                      placeholder="e.g. Boer, Merino"
                      registration={register("breed")}
                      error={errors.breed?.message}
                    />

                    <InputField
                      type="number"
                      step="0.1"
                      name="weight"
                      label="Weight (kg)"
                      placeholder="Optional"
                      registration={register("weight")}
                      error={errors.weight?.message}
                    />

                    <InputField
                      type="date"
                      name="DOB"
                      label="Date of birth (optional)"
                      registration={register("DOB")}
                      error={errors.DOB?.message}
                    />

                    <InputField
                      type="text"
                      name="location"
                      label="Location / pen (optional)"
                      placeholder="e.g. Pen 3, east paddock"
                      registration={register("location")}
                      error={errors.location?.message}
                    />

                    {String(gender).toUpperCase() === "FEMALE" && (
                      <InputField
                        type="text"
                        name="motherTag"
                        label="Mother tag (optional)"
                        placeholder="Tag of the dam"
                        registration={register("motherTag")}
                        error={errors.motherTag?.message}
                      />
                    )}

                    <div className="sm:col-span-2 flex justify-end items-center mt-6">
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
                        {loading ? "Saving..." : "Save"}
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

export default LivestockFormModal;
