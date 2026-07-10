import { z } from "zod";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect, useState, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import useAddFarm from "@/hooks/api/farms";
import { InputField } from "@/components/input";
import { useFetchUsers, useUsers, isLoggedIn } from "@/hooks/api/auth";
import { isSuperAdmin } from "@/utils/permissions";
import {
  AFRICAN_COUNTRIES,
  loadRwandaHierarchy,
  type CountryOption,
} from "./locationData";
import { LocationTypeahead } from "./LocationTypeahead";

const farmSchema = z.object({
  name: z.string().nonempty("Name is required"),
  size: z.string().nonempty("Size is required"),
  type: z.string().nonempty("Type is required"),
  ownerId: z.string().optional(),
});

const AddFarmModal = ({ isOpen, onClose, handleRefetch }: any) => {
  const user = isLoggedIn();
  const superAdmin = isSuperAdmin(user?.role);
  const { addFarm, loading, error } = useAddFarm();
  const { users: farmUsers, loading: usersLoadingFarm, error: usersErrorFarm, refetch: refetchFarmUsers } = useUsers();
  const { users: allUsers, loading: usersLoadingAll, fetchUsers } = useFetchUsers();

  useEffect(() => {
    if (superAdmin) {
      fetchUsers({});
    } else {
      refetchFarmUsers("pageSize=100000");
    }
  }, [superAdmin, isOpen]);

  const ownerList: any[] =
    (superAdmin ? (allUsers as any) : (farmUsers as any))?.data?.data ?? [];
  const usersLoading = superAdmin ? usersLoadingAll : usersLoadingFarm;
  const usersError = superAdmin ? null : usersErrorFarm;

  const [fullHierarchy, setFullHierarchy] = useState<CountryOption[]>([]);
  const [rwandaLoading, setRwandaLoading] = useState(false);
  const [countryId, setCountryId] = useState("");
  const [provinceId, setProvinceId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [sectorId, setSectorId] = useState("");
  const [cellId, setCellId] = useState("");
  const [villageId, setVillageId] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const initial: CountryOption[] = AFRICAN_COUNTRIES.map((c) => ({
      id: c.id,
      name: c.name,
      provinces: [],
    }));
    setFullHierarchy(initial);
    setRwandaLoading(true);
    loadRwandaHierarchy()
      .then((rwanda) => {
        setFullHierarchy((prev) =>
          prev.map((c) => (c.id === "rwanda" ? rwanda : c))
        );
      })
      .catch(() => {})
      .finally(() => setRwandaLoading(false));
  }, [isOpen]);

  const selectedCountry = useMemo(
    () => fullHierarchy.find((c) => c.id === countryId),
    [fullHierarchy, countryId]
  );
  const selectedProvince = useMemo(
    () => selectedCountry?.provinces.find((p) => p.id === provinceId),
    [selectedCountry, provinceId]
  );
  const selectedDistrict = useMemo(
    () => selectedProvince?.districts.find((d) => d.id === districtId),
    [selectedProvince, districtId]
  );
  const selectedSector = useMemo(
    () => selectedDistrict?.sectors.find((s) => s.id === sectorId),
    [selectedDistrict, sectorId]
  );
  const selectedCell = useMemo(
    () => selectedSector?.cells.find((c) => c.id === cellId),
    [selectedSector, cellId]
  );
  const selectedVillage = useMemo(
    () => selectedCell?.villages.find((v) => v.id === villageId),
    [selectedCell, villageId]
  );

  const locationString = useMemo(() => {
    const parts = [
      selectedCountry?.name,
      selectedProvince?.name,
      selectedDistrict?.name,
      selectedSector?.name,
      selectedCell?.name,
      selectedVillage?.name,
    ].filter(Boolean);
    return parts.join(" / ");
  }, [
    selectedCountry,
    selectedProvince,
    selectedDistrict,
    selectedSector,
    selectedCell,
    selectedVillage,
  ]);

  const clearBelowCountry = () => {
    setProvinceId("");
    setDistrictId("");
    setSectorId("");
    setCellId("");
    setVillageId("");
  };
  const clearBelowProvince = () => {
    setDistrictId("");
    setSectorId("");
    setCellId("");
    setVillageId("");
  };
  const clearBelowDistrict = () => {
    setSectorId("");
    setCellId("");
    setVillageId("");
  };
  const clearBelowSector = () => {
    setCellId("");
    setVillageId("");
  };
  const clearBelowCell = () => setVillageId("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(farmSchema),
  });

  const resetLocation = () => {
    setCountryId("");
    setProvinceId("");
    setDistrictId("");
    setSectorId("");
    setCellId("");
    setVillageId("");
  };

  useEffect(() => {
    if (!isOpen) resetLocation();
  }, [isOpen]);

  const onSubmit = async (data: any) => {
    if (!locationString.trim()) {
      return;
    }
    try {
      const payload = {
        name: data.name,
        location: locationString,
        size: parseFloat(data.size),
        type: data.type,
        ownerId: superAdmin ? data.ownerId || undefined : user?.userId,
      };
      await addFarm(payload);
      onClose();
      handleRefetch();
      reset();
      resetLocation();
    } catch (err) {
      // Handle error if needed
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
                <div className="flex bg-[#fbfbfb] dark:bg-[#121c2c] items-center justify-between px-5 py-3">
                  <div className="font-bold text-lg">Add New Farm</div>
                </div>
                <div className="p-5">
                  {error && <div className="text-red-500">{error}</div>}
                  {usersError && (
                    <div className="text-red-500">{usersError}</div>
                  )}
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <InputField
                        type="text"
                        label="Name"
                        placeholder="Enter farm name"
                        registration={register("name")}
                        error={errors.name?.message}
                        name="name"
                      />
                      <InputField
                        type="number"
                        label="Size"
                        name="size"
                        registration={register("size")}
                        placeholder="Enter farm size"
                        error={errors.size?.message}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                        Location
                      </label>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-0.5">Country</label>
                          <LocationTypeahead
                            options={fullHierarchy}
                            value={countryId}
                            onChange={(id) => {
                              setCountryId(id);
                              clearBelowCountry();
                            }}
                            placeholder={rwandaLoading ? "Loading..." : "Type or select country"}
                            className="form-input w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-0.5">Province</label>
                          <LocationTypeahead
                            options={selectedCountry?.provinces ?? []}
                            value={provinceId}
                            onChange={(id) => {
                              setProvinceId(id);
                              clearBelowProvince();
                            }}
                            placeholder="Type or select province"
                            disabled={!selectedCountry}
                            className="form-input w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm py-2 disabled:opacity-50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-0.5">District</label>
                          <LocationTypeahead
                            options={selectedProvince?.districts ?? []}
                            value={districtId}
                            onChange={(id) => {
                              setDistrictId(id);
                              clearBelowDistrict();
                            }}
                            placeholder="Type or select district"
                            disabled={!selectedProvince}
                            className="form-input w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm py-2 disabled:opacity-50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-0.5">Sector</label>
                          <LocationTypeahead
                            options={selectedDistrict?.sectors ?? []}
                            value={sectorId}
                            onChange={(id) => {
                              setSectorId(id);
                              clearBelowSector();
                            }}
                            placeholder="Type or select sector"
                            disabled={!selectedDistrict}
                            className="form-input w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm py-2 disabled:opacity-50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-0.5">Cell</label>
                          <LocationTypeahead
                            options={selectedSector?.cells ?? []}
                            value={cellId}
                            onChange={(id) => {
                              setCellId(id);
                              clearBelowCell();
                            }}
                            placeholder="Type or select cell"
                            disabled={!selectedSector}
                            className="form-input w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm py-2 disabled:opacity-50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-0.5">Village</label>
                          <LocationTypeahead
                            options={selectedCell?.villages ?? []}
                            value={villageId}
                            onChange={setVillageId}
                            placeholder="Type or select village"
                            disabled={!selectedCell}
                            className="form-input w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm py-2 disabled:opacity-50"
                          />
                        </div>
                      </div>
                      {!locationString && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Select at least country (Rwanda has full provinces, districts, sectors, cells &amp; villages)
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <InputField
                        type="text"
                        registration={register("type")}
                        label="Type"
                        placeholder="Enter farm type"
                        name="type"
                        error={errors.type?.message}
                      />
                      {superAdmin && (
                      <div>
                        <label
                          htmlFor="ownerId"
                          className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1"
                        >
                          Owner (Farm Admin) — optional
                        </label>
                        <select
                          id="ownerId"
                          {...register("ownerId")}
                          className="form-select w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                        >
                          <option value="">No owner yet (assign when adding farm admin)</option>
                          {usersLoading ? (
                            <option>Loading...</option>
                          ) : (
                            ownerList
                              .filter((u: any) => u.account?.role === "ADMIN")
                              .map((u: any) => (
                                <option key={u.id} value={u.id}>
                                  {u.fullname}
                                </option>
                              ))
                          )}
                        </select>
                        {errors.ownerId?.message && (
                          <p className="text-xs text-danger mt-0.5">{String(errors.ownerId.message)}</p>
                        )}
                      </div>
                      )}
                    </div>
                    {!superAdmin && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        This farm will be registered under your account and marked pending until super admin activates it.
                      </p>
                    )}
                    <div className="flex justify-end items-center mt-6">
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
                        disabled={loading || !locationString.trim()}
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

export default AddFarmModal;
