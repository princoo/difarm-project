import { useFarms } from "@/hooks/api/farms";
import { useState, useEffect } from "react";
import DataTableV2, { TableColumnV2 } from "@/components/datatable";
import formatDateToLongForm from "@/utils/DateFormattter";
import { capitalize } from "lodash";
import IconPlus from "@/components/Icon/IconPlus";
import IconHome from "@/components/Icon/IconHome";
import IconTrash from "@/components/Icon/IconTrash";
import IconPencil from "@/components/Icon/IconPencil";
import IconEye from "@/components/Icon/IconEye";
import ConfirmDeleteModal from "./delete";
import AssignManagerModal from "./assign_manager";
import { useNavigate } from "@/lib/router-compat";
import { isLoggedIn, useFetchUsers } from "@/hooks/api/auth";
import { activateFarm as activateFarmApi } from "@/hooks/api/farms";
import { canActivateFarm, canDeleteEntity, canUpdateEntity, isFarmAdmin, isSuperAdmin } from "@/utils/permissions";
import toast from "react-hot-toast";
import { setFarmId } from "@/utils/farmId";
import { MagnifyingGlassIcon, UserPlusIcon } from "@heroicons/react/24/outline";

const FarmsList = () => {
  const navigate = useNavigate();
  const user = isLoggedIn();
  const superAdmin = isSuperAdmin(user?.role);
  const farmAdmin = isFarmAdmin(user?.role);
  const canViewFarmDetail = ["SUPERADMIN", "ADMIN", "MANAGER"].includes(user?.role ?? "");
  const canCreateFarm = superAdmin || farmAdmin;
  const { farms, loading, error, fetchFarms } = useFarms({ autoFetch: false });
  const { users: allUsers, fetchUsers } = useFetchUsers();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState<any>(null);
  const canAssignManager = superAdmin || farmAdmin;
  const canEditFarm = canUpdateEntity('farms', user?.role ?? '');
  const canDeleteFarm = canDeleteEntity('farms', user?.role ?? '');

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [ownerFilter, setOwnerFilter] = useState<string>("");

  useEffect(() => {
    if (superAdmin) {
      fetchUsers({});
    }
  }, [superAdmin]);

  useEffect(() => {
    if (superAdmin) {
      fetchFarms({
        status: statusFilter || undefined,
        search: searchFilter || undefined,
        location: locationFilter || undefined,
        ownerId: ownerFilter || undefined,
      });
    } else {
      fetchFarms();
    }
  }, [superAdmin, statusFilter, searchFilter, locationFilter, ownerFilter]);

  const handleActivate = async (farmId: string) => {
    try {
      await activateFarmApi(farmId);
      toast.success("Farm activated");
      fetchFarms(
        superAdmin
          ? {
              status: statusFilter || undefined,
              search: searchFilter || undefined,
              location: locationFilter || undefined,
              ownerId: ownerFilter || undefined,
            }
          : undefined
      );
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to activate farm");
    }
  };

  const handleRefetch = () => {
    if (superAdmin) {
      fetchFarms({
        status: statusFilter || undefined,
        search: searchFilter || undefined,
        location: locationFilter || undefined,
        ownerId: ownerFilter || undefined,
      });
    } else {
      fetchFarms();
    }
  };

  const farmList = farms?.data ?? [];
  const adminUsers = (allUsers?.data?.data ?? []).filter(
    (u: any) => u.account?.role === "ADMIN"
  );

  const baseColumns: TableColumnV2<any>[] = [
    {
      title: "Name",
      accessor: "name",
      render: (row) => <p className="capitalize">{row?.name}</p>,
    },
    {
      title: "Location",
      accessor: "location",
      render: (row) => <p className="capitalize">{row?.location}</p>,
    },
    {
      title: "Size",
      accessor: "size",
      render: (row) => <p>{capitalize(String(row?.size))}</p>,
    },
    {
      title: "Type",
      accessor: "type",
      render: (row) => <p>{capitalize(row?.type)}</p>,
    },
    {
      title: "Owner",
      accessor: "owner.name",
      render: (row) => (
        <p>{row?.owner ? capitalize(row.owner.fullname) : "Unassigned"}</p>
      ),
    },
    {
      title: "Date Created",
      accessor: "createdAt",
      render: (row) => <p>{formatDateToLongForm(row?.createdAt)}</p>,
    },
  ];

  const statusColumn: TableColumnV2<any> = {
    title: "Status",
    accessor: "status",
    render: (row) => (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          row?.status
            ? "bg-success-light text-success dark:bg-success-dark-light dark:text-success"
            : "bg-warning-light text-warning dark:bg-warning-dark-light dark:text-warning"
        }`}
      >
        {row?.status ? "Activated" : "Pending"}
      </span>
    ),
  };

  const actionsColumn: TableColumnV2<any> = {
    title: "Actions",
    accessor: "actions",
    render: (row) => (
      <div className="flex gap-2 justify-center items-center">
        {canViewFarmDetail && (
          <button
            type="button"
            onClick={() => {
              setFarmId(row.id);
              navigate(`/account/farms/${row?.id}`);
            }}
            className="text-primary hover:underline"
            title="View farm details"
          >
            <IconEye className="w-5 h-5" />
          </button>
        )}
        {canActivateFarm(user?.role) && !row?.status && (
          <button
            type="button"
            onClick={() => handleActivate(row?.id)}
            className="text-primary hover:underline text-sm"
          >
            Activate
          </button>
        )}
        {canEditFarm && (
          <button
            type="button"
            onClick={() => {
              setFarmId(row.id);
              navigate(`/account/farms/${row?.id}/edit`);
            }}
            title="Edit farm profile"
          >
            <IconPencil className="text-primary" />
          </button>
        )}
        {canAssignManager && (
          <button
            type="button"
            onClick={() => {
              setSelectedFarm(row);
              setIsAssignModalOpen(true);
            }}
            title="Assign manager"
            className="text-primary"
          >
            <UserPlusIcon className="w-5 h-5" />
          </button>
        )}
        {canDeleteFarm && (
          <button
            type="button"
            onClick={() => {
              setSelectedFarm(row);
              setIsDeleteModalOpen(true);
            }}
          >
            <IconTrash className="text-danger" />
          </button>
        )}
      </div>
    ),
  };

  const columns: TableColumnV2<any>[] =
    superAdmin || farmAdmin
      ? [...baseColumns, statusColumn, actionsColumn]
      : [...baseColumns, actionsColumn];

  return (
    <div className="p-4">
      <ol className="flex text-gray-500 font-semibold dark:text-white-dark text-sm">
        <li>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="hover:text-gray-500/70 dark:hover:text-white-dark/70"
          >
            <IconHome />
          </button>
        </li>
        <li className="before:content-['/'] before:px-1.5">
          <span className="text-black dark:text-white-light">Farms</span>
        </li>
      </ol>

      <div className="flex flex-wrap items-end justify-between gap-4 mb-4 mt-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Farms
        </h1>
        {canCreateFarm && (
          <button
            type="button"
            onClick={() => navigate("/register-farm")}
            className="btn btn-primary inline-flex items-center gap-2"
          >
            <IconPlus className="w-5 h-5" />
            {farmAdmin ? "Register new farm" : "Create new farm"}
          </button>
        )}
      </div>

      {farmAdmin && !superAdmin && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 -mt-2">
          New farms stay <strong>Pending</strong> until a super admin activates them. Managers can only work on activated farms.
        </p>
      )}

      {superAdmin && (
        <div className="flex flex-wrap gap-3 mb-6 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-1 min-w-[140px] max-w-xs">
              <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by farm name"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <input
              type="text"
              placeholder="Location / District"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="form-input w-auto min-w-[140px] py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 min-w-[120px]"
            >
              <option value="">All statuses</option>
              <option value="true">Activated</option>
              <option value="false">Pending</option>
            </select>
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="form-select py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 min-w-[140px]"
            >
              <option value="">All owners</option>
              {adminUsers.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.fullname}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {error && (
        <p className="text-danger text-sm mb-2">{error}</p>
      )}

      <AssignManagerModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        farm={selectedFarm}
        handleRefetch={handleRefetch}
      />
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        farm={selectedFarm}
        handleRefetch={handleRefetch}
      />

      <div className="w-full">
        <DataTableV2
          columns={columns}
          previousPage={0}
          nextPage={0}
          currentPage={1}
          data={farmList}
          total={farmList.length}
          lastPage={1}
          isLoading={loading}
          tableName="Farms"
        />
      </div>

      {!loading && farmList.length > 0 && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Showing {farmList.length} farm(s)
        </p>
      )}
    </div>
  );
};

export default FarmsList;
