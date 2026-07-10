import { useEffect, useMemo, useState } from "react";
import DataTableV2, { TableColumnV2 } from "@/components/datatable";
import formatDateToLongForm from "@/utils/DateFormattter";
import { capitalize } from "lodash";
import IconPlus from "@/components/Icon/IconPlus";
import IconEdit from "@/components/Icon/IconEdit";
import IconTrash from "@/components/Icon/IconTrash";
import { toast } from "react-hot-toast";
import { useCattle } from "@/hooks/api/cattle";
import AddCattleModal from "./add_cattle";
import UpdateCattleModal from "./update_cattle";
import ConfirmDeleteModal from "./delete_cattle";
import { useSearchParams, useNavigate } from "@/lib/router-compat";
import { isLoggedIn } from "@/hooks/api/auth";
import { getFarmId } from "@/utils/farmId";
import { canCreateEntity, canUpdateEntity, canDeleteEntity } from "@/utils/permissions";
import CattleAvatar from "./CattleAvatar";
import { CATTLE_STATUSES, statusColor, statusDotColor, statusLabel } from "./cattleStatus";
import {
  MagnifyingGlassIcon,
  Squares2X2Icon,
  TableCellsIcon,
  MapPinIcon,
  ScaleIcon,
} from "@heroicons/react/24/outline";

type ViewMode = "card" | "table";

const CattleList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchKey = searchParams.toString();
  const user = isLoggedIn();
  const role = user?.role ?? "";
  const canCreate = canCreateEntity("cattle", role);
  const canUpdate = canUpdateEntity("cattle", role);
  const canDelete = canDeleteEntity("cattle", role);
  const { cattle, allCattles, loading, fetchCattle, fetchAllCattle, deleteCattle }: any =
    useCattle();

  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCattle, setSelectedCattle] = useState<any>(null);

  const farmId = getFarmId();

  useEffect(() => {
    if (!farmId) return;
    fetchAllCattle();
  }, [farmId]);

  useEffect(() => {
    if (!farmId || viewMode !== "table") return;
    fetchCattle(searchParams);
  }, [searchKey, farmId, viewMode]);

  const cardList = allCattles?.data?.data ?? [];
  const tableList = cattle?.data?.data ?? [];

  const filteredCardList = useMemo(() => {
    let result = cardList;
    if (statusFilter) {
      result = result.filter((c: any) => c.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c: any) =>
          (c.tagNumber || "").toLowerCase().includes(q) ||
          (c.breed || "").toLowerCase().includes(q) ||
          (c.gender || "").toLowerCase().includes(q) ||
          (c.farm?.name || "").toLowerCase().includes(q) ||
          (c.location || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [cardList, statusFilter, searchQuery]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { "": cardList.length };
    cardList.forEach((c: any) => {
      const s = c.status || "Other";
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [cardList]);

  const displayCount = (s: string) =>
    statusFilter === s ? filteredCardList.length : statusCounts[s] ?? 0;

  const handleDelete = async () => {
    try {
      await deleteCattle(selectedCattle?.id);
      toast.success("Cattle deleted successfully");
      fetchAllCattle();
      if (viewMode === "table") fetchCattle(searchParams);
    } catch {
      toast.error("Failed to delete cattle");
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  const handleRefetch = () => {
    fetchAllCattle();
    if (viewMode === "table") fetchCattle(searchParams);
  };

  const openDetail = (id: string) => navigate(`/account/cattle/detail/${id}`);

  const openUpdateModal = (row: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedCattle(row);
    setIsUpdateModalOpen(true);
  };

  const openDeleteModal = (row: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedCattle(row);
    setIsDeleteModalOpen(true);
  };

  const columns: TableColumnV2<any>[] = [
    {
      title: "Tag Number",
      accessor: "tagNumber",
      render: (row) => (
        <div>
          <p>{row?.tagNumber}</p>
          <p className="text-xs text-gray-500">{capitalize(row?.breed)}</p>
        </div>
      ),
    },
    {
      title: "Gender",
      accessor: "gender",
      render: (row) => <p>{capitalize(row?.gender)}</p>,
    },
    {
      title: "Weight (Kg)",
      accessor: "weight",
      render: (row) => <p>{row?.weight}</p>,
    },
    {
      title: "Status",
      accessor: "status",
      render: (row) => (
        <span className="inline-flex items-center gap-2">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: statusDotColor(row?.status) }}
          />
          {statusLabel(row?.status)}
        </span>
      ),
    },
    {
      title: "Farm",
      accessor: "farm.name",
      render: (row) => <p>{row?.farm?.name}</p>,
    },
    {
      title: "Last Checkup",
      accessor: "lastCheckupDate",
      render: (row) => <p>{row?.lastCheckupDate ? formatDateToLongForm(row.lastCheckupDate) : "—"}</p>,
    },
    {
      title: "Date of Birth",
      accessor: "DOB",
      render: (row) => <p>{row.DOB ? formatDateToLongForm(row.DOB) : "—"}</p>,
    },
    {
      title: "Actions",
      accessor: "actions",
      render: (row: any) => (
        <div className="flex gap-2 justify-center items-center">
          <button type="button" onClick={() => openDetail(row.id)} className="text-primary text-sm font-medium">
            View
          </button>
          {canUpdate && (
            <button type="button" onClick={() => openUpdateModal(row)}>
              <IconEdit className="text-primary" />
            </button>
          )}
          {canDelete && (
            <button type="button" onClick={() => openDeleteModal(row)}>
              <IconTrash className="text-danger" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <ol className="flex text-gray-500 font-semibold dark:text-white-dark text-sm">
            <li>
              <button type="button" onClick={() => navigate("/account")} className="hover:text-gray-700 dark:hover:text-white">
                Dashboard
              </button>
            </li>
            <li className="before:content-['/'] before:px-1.5">
              <span className="text-black dark:text-white-light">Cattle</span>
            </li>
          </ol>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">Cattle</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode("card")}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium ${
                viewMode === "card"
                  ? "bg-primary text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <Squares2X2Icon className="w-4 h-4" />
              Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium ${
                viewMode === "table"
                  ? "bg-primary text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <TableCellsIcon className="w-4 h-4" />
              Table
            </button>
          </div>
          {canCreate && (
            <button type="button" onClick={() => setIsAddModalOpen(true)} className="btn btn-primary inline-flex items-center gap-2">
              <IconPlus className="w-5 h-5" />
              Add Cattle
            </button>
          )}
        </div>
      </div>

      {viewMode === "card" && (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            {CATTLE_STATUSES.map((s) => (
              <button
                key={s || "all"}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  statusFilter === s
                    ? "bg-primary text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {s ? statusLabel(s) : "All"} ({displayCount(s)})
              </button>
            ))}
          </div>

          <div className="flex gap-2 mb-6">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by tag, breed, gender, farm…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          {loading && <p className="text-gray-500">Loading cattle…</p>}
          {!loading && filteredCardList.length === 0 && (
            <div className="text-center py-16 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
              <p className="text-gray-500">No cattle found.</p>
              {canCreate && (
                <button type="button" className="btn btn-primary mt-4" onClick={() => setIsAddModalOpen(true)}>
                  Add your first cattle
                </button>
              )}
            </div>
          )}
          {!loading && filteredCardList.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCardList.map((c: any) => (
                <article
                  key={c.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openDetail(c.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openDetail(c.id);
                    }
                  }}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md hover:border-primary/40 transition-all cursor-pointer overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex flex-col items-center text-center">
                      <CattleAvatar tagNumber={c.tagNumber} breed={c.breed} size="md" className="mb-2" />
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate w-full">
                        {c.tagNumber}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate w-full">
                        {capitalize(c.breed || "")}
                      </p>
                      <span className={`mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(c.status)}`}>
                        {statusLabel(c.status)}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <ScaleIcon className="w-4 h-4 shrink-0 text-gray-400" />
                        <span>{c.weight != null ? `${c.weight} kg` : "—"} · {capitalize(c.gender || "")}</span>
                      </div>
                      {(c.farm?.name || c.location) && (
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPinIcon className="w-4 h-4 shrink-0 text-gray-400" />
                          <span className="truncate">{c.farm?.name || c.location}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => openDetail(c.id)}
                        className="btn btn-primary flex-1 min-w-0 py-1.5 text-xs font-medium"
                      >
                        View
                      </button>
                      {canUpdate && (
                        <button
                          type="button"
                          onClick={(e) => openUpdateModal(c, e)}
                          className="btn btn-outline-primary py-1.5 px-2 text-xs font-medium"
                        >
                          Edit
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={(e) => openDeleteModal(c, e)}
                          className="btn btn-outline-danger py-1.5 px-2 text-xs font-medium"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!loading && cardList.length > 0 && (
            <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
              Showing {filteredCardList.length} of {cardList.length} cattle
            </p>
          )}
        </>
      )}

      {viewMode === "table" && (
        <div className="w-full">
          <DataTableV2
            columns={columns}
            data={tableList}
            isLoading={loading}
            tableName="Cattle"
            currentPage={cattle?.data?.currentPage ?? 0}
            total={cattle?.data?.total}
            lastPage={(cattle?.data?.totalPages ?? 0) + 1}
            previousPage={cattle?.data?.previousPage}
            nextPage={cattle?.data?.nextPage}
          />
        </div>
      )}

      <AddCattleModal
        cattles={cardList}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        handleRefetch={handleRefetch}
      />
      <UpdateCattleModal
        cattles={cardList}
        isOpen={isUpdateModalOpen}
        onClose={() => {
          setSelectedCattle(null);
          setIsUpdateModalOpen(false);
        }}
        cattle={selectedCattle}
        handleRefetch={handleRefetch}
      />
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default CattleList;
