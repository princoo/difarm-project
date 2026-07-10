import { z } from "zod";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { InputField } from "@/components/input";
import { isLoggedIn, useUsers } from "@/hooks/api/auth";
import { useFarms } from "@/hooks/api/farms";
import { isFarmAdmin, isSuperAdmin } from "@/utils/permissions";

const userSchema = z.object({
  fullname: z.string().nonempty("Full name is required"),
  username: z.string().nonempty("Username is required"),
  email: z
    .string()
    .nonempty("Email is required")
    .email("Invalid email address"),
  gender: z.string().nonempty("Gender is required"),
  phone: z.string().nonempty("Phone is required"),
  password: z
    .string()
    .nonempty("Password is required")
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password must be at least 8 characters long and include at least one letter, one number, and one special character"
    ),
  farmId: z.string().min(1, "Farm assignment is required"),
});

type AddUserModalProps = {
  isOpen: boolean;
  onClose: () => void;
  handleRefetch: () => void;
};

const AddUserModal = ({ isOpen, onClose, handleRefetch }: AddUserModalProps) => {
  const currentUser = isLoggedIn();
  const superAdmin = isSuperAdmin(currentUser?.role);
  const farmAdmin = isFarmAdmin(currentUser?.role);
  const { addUser, loading, error } = useUsers();
  const { farms, fetchFarms } = useFarms({ autoFetch: false });
  const [assignableFarms, setAssignableFarms] = useState<
    { id: string; name: string; status?: boolean }[]
  >([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(userSchema),
  });

  useEffect(() => {
    if (!isOpen || (!farmAdmin && !superAdmin)) return;
    if (superAdmin) {
      fetchFarms({ unassigned: true });
    } else {
      fetchFarms();
    }
  }, [isOpen, farmAdmin, superAdmin, fetchFarms]);

  useEffect(() => {
    const list = farms?.data ?? [];
    const assignable = farmAdmin
      ? list.filter((f: { status?: boolean }) => f.status !== false)
      : list.filter((f: { ownerId?: string | null }) => !f.ownerId);
    setAssignableFarms(assignable);
    if (assignable.length === 1) {
      setValue("farmId", assignable[0].id);
    } else {
      setValue("farmId", "");
    }
  }, [farms, farmAdmin, superAdmin, setValue]);

  const onSubmit = async (data: z.infer<typeof userSchema>) => {
    await addUser(data);
    onClose();
    handleRefetch();
    reset();
  };

  const title = superAdmin ? "Add Farm Admin" : "Add Farm Manager";
  const subtitle = superAdmin
    ? "Assigns a farm admin to a farm with no admin yet. Create unassigned farms under Farms first."
    : "Assigns a manager to one of your activated farms. You can add multiple managers to the same farm.";
  const needsFarm = superAdmin || farmAdmin;

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
              <Dialog.Panel className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-xl my-8 text-black dark:text-white-dark">
                <div className="flex bg-[#fbfbfb] dark:bg-[#121c2c] items-center justify-between px-5 py-3">
                  <div>
                    <div className="font-bold text-lg">{title}</div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
                  </div>
                </div>
                <div className="p-5">
                  {error && <div className="text-red-500">{String(error)}</div>}
                  <form onSubmit={handleSubmit(onSubmit)}>
                    {needsFarm && (
                      <div className="mb-4">
                        <label
                          htmlFor="farmId"
                          className="block text-sm font-bold text-gray-700 dark:text-gray-300"
                        >
                          Assign to farm
                        </label>
                        <select
                          id="farmId"
                          {...register("farmId")}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600"
                        >
                          <option value="">Select farm</option>
                          {assignableFarms.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name}
                              {superAdmin && f.status === false ? " (Pending)" : ""}
                            </option>
                          ))}
                        </select>
                        {assignableFarms.length === 0 && (
                          <p className="text-xs text-warning mt-1">
                            {superAdmin
                              ? "No unassigned farms. Create a farm under Farms without an owner, then assign a farm admin here."
                              : "No activated farms yet. Ask super admin to activate your farm first."}
                          </p>
                        )}
                        {errors.farmId && (
                          <p className="mt-1 text-sm text-red-600">{errors.farmId.message}</p>
                        )}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="mb-4">
                        <InputField
                          type="text"
                          label="Full Name"
                          placeholder="Enter full name"
                          registration={register("fullname")}
                          error={errors.fullname?.message}
                          name="fullName"
                        />
                      </div>
                      <div className="mb-4">
                        <InputField
                          type="text"
                          label="Username"
                          placeholder="Enter username"
                          registration={register("username")}
                          error={errors.username?.message}
                          name="username"
                        />
                      </div>
                      <div className="mb-4">
                        <InputField
                          type="email"
                          label="Email"
                          placeholder="Enter email"
                          registration={register("email")}
                          error={errors.email?.message}
                          name="email"
                        />
                      </div>
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
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                          <option value="">Select Gender</option>
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                        </select>
                        {errors.gender && (
                          <p className="mt-2 text-sm text-red-600">Gender is required</p>
                        )}
                      </div>
                      <div className="mb-4">
                        <InputField
                          type="text"
                          label="Phone"
                          placeholder="Enter phone number"
                          registration={register("phone")}
                          error={errors.phone?.message}
                          name="phone"
                        />
                      </div>
                      <div className="mb-4">
                        <InputField
                          type="password"
                          label="Password"
                          placeholder="Enter password"
                          registration={register("password")}
                          error={errors.password?.message}
                          name="password"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end items-center mt-8">
                      <button type="button" onClick={onClose} className="btn btn-outline-danger">
                        Discard
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary ltr:ml-4 rtl:mr-4"
                        disabled={loading || (needsFarm && assignableFarms.length === 0)}
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

export default AddUserModal;
