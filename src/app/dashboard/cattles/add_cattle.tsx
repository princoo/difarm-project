import { z } from "zod";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { InputField } from "@/components/input";
import { useCattle } from "@/hooks/api/cattle";
import { Autocomplete } from "@mantine/core";
import toast from "react-hot-toast";
import { getFarmId } from "@/utils/farmId";

const hasFieldValue = (value: unknown) =>
  value != null && String(value).trim() !== "";

const cattleSchema = z
  .object({
    tagNumber: z
      .string()
      .min(3, "Tag number must be at least 3 characters")
      .nonempty("Tag number is required"),
    breed: z
      .string()
      .min(3, "Breed must be at least 3 characters")
      .nonempty("Breed is required"),
    gender: z.string().nonempty("Gender is required"),
    weight: z.string().nonempty("Weight is required"),
    location: z
      .string()
      .min(3, "Location must be at least 3 characters")
      .nonempty("Location is required"),
    lastCheckupDate: z.string().nonempty("Last checkup date is required"),
    birthOrigin: z.enum(["OnFarm", "Purchased"]),
    purchaseDate: z.union([z.string(), z.null(), z.undefined()]),
    DOB: z.union([z.string(), z.null(), z.undefined()]),
    previousOwner: z.union([z.string(), z.null(), z.undefined()]),
    motherTag: z.union([z.string(), z.null(), z.undefined()]),
    price: z.union([z.string(), z.null(), z.undefined()]),
  })
  .superRefine(
    (
      { birthOrigin, purchaseDate, previousOwner, price, motherTag, DOB },
      ctx
    ) => {
      if (birthOrigin === "Purchased") {
        if (!hasFieldValue(purchaseDate)) {
          ctx.addIssue({
            code: "custom",
            message: "Purchase date is required for purchased cattle",
            path: ["purchaseDate"],
          });
        }
        if (!hasFieldValue(previousOwner)) {
          ctx.addIssue({
            code: "custom",
            message: "Previous owner is required for purchased cattle",
            path: ["previousOwner"],
          });
        }
        if (!hasFieldValue(price)) {
          ctx.addIssue({
            code: "custom",
            message: "Price is required for purchased cattle",
            path: ["price"],
          });
        }
        if (motherTag || DOB) {
          ctx.addIssue({
            code: "custom",
            message:
              "Mother tag and date of birth are only used for on-farm births",
            path: ["motherTag"],
          });
        }
      }

      if (birthOrigin === "OnFarm") {
        if (!hasFieldValue(DOB)) {
          ctx.addIssue({
            code: "custom",
            message: "Date of birth is required for on-farm births",
            path: ["DOB"],
          });
        }
        if (
          hasFieldValue(motherTag) &&
          String(motherTag).trim().length < 3
        ) {
          ctx.addIssue({
            code: "custom",
            message: "Mother tag must be at least 3 characters",
            path: ["motherTag"],
          });
        }
        if (
          hasFieldValue(purchaseDate) ||
          hasFieldValue(previousOwner) ||
          hasFieldValue(price)
        ) {
          ctx.addIssue({
            code: "custom",
            message: "Purchase details are only used for purchased cattle",
            path: ["purchaseDate"],
          });
        }
      }
    }
  );

const AddCattleModal = ({ isOpen, onClose, handleRefetch, cattles }: any) => {
  const { addCattle, loading, error } = useCattle();

  const motherSuggestions = useMemo(
    () => (cattles ?? []).map((cattle: any) => String(cattle.tagNumber)),
    [cattles]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<z.infer<typeof cattleSchema>>({
    resolver: zodResolver(cattleSchema),
    defaultValues: {
      tagNumber: '',
      breed: '',
      gender: '',
      weight: '',
      location: '',
      lastCheckupDate: '',
      birthOrigin: 'OnFarm',
      purchaseDate: null,
      DOB: null,
      previousOwner: null,
      motherTag: '',
      price: null,
    },
  });

  const birthOrigin = watch("birthOrigin");
  const motherTag = watch("motherTag");
  const farmId = getFarmId();

  useEffect(() => {
    if (!isOpen) return;
    reset();
  }, [isOpen, reset]);

  useEffect(() => {
    if (birthOrigin === "OnFarm") {
      setValue("purchaseDate", null);
      setValue("previousOwner", null);
      setValue("price", null);
    } else if (birthOrigin === "Purchased") {
      setValue("motherTag", null);
      setValue("DOB", null);
    }
  }, [birthOrigin, setValue]);

  const onInvalid = (formErrors: typeof errors) => {
    const firstError = Object.values(formErrors)[0]?.message;
    toast.error(
      typeof firstError === "string"
        ? firstError
        : "Please fix the highlighted fields before saving."
    );
  };

  const onSubmit = async (data: any) => {
    if (!farmId) {
      toast.error("No farm selected. Choose a farm first.");
      return;
    }

    try {
      const payload = {
        tagNumber: data.tagNumber,
        breed: data.breed,
        gender: data.gender,
        birthOrigin: data.birthOrigin,
        previousOwner:
          data.birthOrigin === "Purchased" ? data.previousOwner : null,
        motherTag:
          data.birthOrigin === "OnFarm" && hasFieldValue(data.motherTag)
            ? String(data.motherTag).trim()
            : null,
        DOB:
          data.birthOrigin === "OnFarm" && data.DOB
            ? new Date(data.DOB).toISOString()
            : null,
        weight: parseFloat(data.weight),
        price:
          data.birthOrigin === "Purchased" && hasFieldValue(data.price)
            ? parseFloat(data.price)
            : null,
        location: data.location,
        farmId,
        lastCheckupDate: new Date(data.lastCheckupDate).toISOString(),
        vaccineHistory: data.vaccineHistory ?? "",
        purchaseDate:
          data.birthOrigin === "Purchased" && data.purchaseDate
            ? new Date(data.purchaseDate).toISOString()
            : null,
      };

      const success = await addCattle(payload);
      if (success) {
        handleRefetch();
        onClose();
        reset();
      }
    } catch {
      // addCattle already surfaces API errors
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
              <Dialog.Panel className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-lg my-8 text-black dark:text-white-dark">
                <div className="flex bg-[#fbfbfb] dark:bg-[#121c2c] items-center justify-between px-5 py-3">
                  <div className="font-bold text-lg">Add New Cattle</div>
                </div>
                <div className="p-5">
                  {error && <div className="text-red-500">{error}</div>}
                  <form
                    onSubmit={handleSubmit(onSubmit, onInvalid)}
                    className="grid grid-cols-2  gap-2 "
                  >
                    <div className="mb-4">
                      <InputField
                        type="text"
                        label="Tag Number"
                        placeholder="Enter tag number"
                        registration={register("tagNumber")}
                        error={errors.tagNumber?.message}
                        name={"tagNumber"}
                      />
                    </div>
                    <div className="mb-4">
                      <InputField
                        type="text"
                        name="breed"
                        label="Breed"
                        placeholder="Enter breed"
                        registration={register("breed")}
                        error={errors.breed?.message}
                      />
                    </div>
                    <div className="mb-4">
                      <label
                        htmlFor="birthOrigin"
                        className="block text-sm font-bold text-gray-700"
                      >
                        Birth Origin
                      </label>
                      <select
                        id="birthOrigin"
                        {...register("birthOrigin")}
                        className="mt-1 block w-full px-3 py-2 border text-gray-400 border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                      >
                        <option value="">Select Origin</option>
                        <option value="OnFarm">OnFarm</option>
                        <option value="Purchased">Purchased</option>
                      </select>
                      {errors.birthOrigin && (
                        <p className="text-sm text-red-600">
                          Birth origin is required
                        </p>
                      )}
                    </div>
                    {birthOrigin === "Purchased" && (
                      <>
                        <div className="mb-4">
                          <InputField
                            type="date"
                            registration={register("purchaseDate")}
                            label="Purchase Date"
                            placeholder="Enter purchase date"
                            name="purchaseDate"
                            error={errors.purchaseDate?.message}
                          />
                        </div>
                        <div className="mb-4">
                          <InputField
                            type="text"
                            registration={register("previousOwner")}
                            label="Previous Owner"
                            placeholder="Enter previous owner"
                            name="previousOwner"
                            error={errors.previousOwner?.message}
                          />
                        </div>
                        <div className="mb-4">
                          <InputField
                            type="number"
                            registration={register("price")}
                            label="Price (RWF)"
                            placeholder="Enter price"
                            name="price"
                            error={errors.price?.message}
                          />
                        </div>
                      </>
                    )}
                    {birthOrigin === "OnFarm" && (
                      <>
                        <div className="mb-4">
                          <InputField
                            type="date"
                            registration={register("DOB")}
                            label="Date of Birth"
                            placeholder="Enter date of birth"
                            name="DOB"
                            error={errors.DOB?.message}
                          />
                        </div>
                        <div className="mb-4">
                          <Autocomplete
                            label="Mother tag (optional)"
                            placeholder="Type a tag or pick from existing cows"
                            value={motherTag ?? ""}
                            onChange={(value) =>
                              setValue("motherTag", value, {
                                shouldValidate: true,
                              })
                            }
                            data={motherSuggestions}
                            error={errors.motherTag?.message}
                          />
                          {errors.motherTag?.message && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.motherTag.message}
                            </p>
                          )}
                          {motherSuggestions.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              Suggestions appear when cows exist on this farm.
                              You can also type any tag.
                            </p>
                          )}
                        </div>
                      </>
                    )}
                    <div className="mb-4">
                      <label
                        htmlFor="gender"
                        className="block text-sm font-bold text-gray-700"
                      >
                        Gender
                      </label>
                      <select
                        id="gender"
                        {...register("gender")}
                        className="mt-1 block w-full px-3 py-2 border text-gray-400 border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                      >
                        <option value="">Select Gender</option>
                        <option value="Cow">Cow</option>
                        <option value="Bull">Bull</option>
                      </select>
                      {errors.gender && (
                        <p className="text-sm text-red-600">
                          Gender is required
                        </p>
                      )}
                    </div>
                    <div className="mb-4">
                      <InputField
                        type="number"
                        registration={register("weight")}
                        label="Weight (kg)"
                        placeholder="Enter weight"
                        name="weight"
                        error={errors.weight?.message}
                      />
                    </div>
                    <div className="mb-4">
                      <InputField
                        type="text"
                        registration={register("location")}
                        label="Location"
                        placeholder="Enter location"
                        name="location"
                        error={errors.location?.message}
                      />
                    </div>

                    <div className="mb-4">
                      <InputField
                        type="date"
                        registration={register("lastCheckupDate")}
                        label="Last Checkup Date"
                        placeholder="Enter last checkup date"
                        name="lastCheckupDate"
                        error={errors.lastCheckupDate?.message}
                      />
                    </div>
                    <div className="col-span-2 flex justify-end items-center mt-8">
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

export default AddCattleModal;
