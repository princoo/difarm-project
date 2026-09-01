import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MagnifyingGlassIcon,
  Squares2X2Icon,
  TableCellsIcon,
  MapPinIcon,
  ScaleIcon,
} from "@heroicons/react/24/outline";
import { capitalize } from "lodash";
import DataTableV2, { TableColumnV2 } from "@/components/datatable";
import IconPlus from "@/components/Icon/IconPlus";
import IconEdit from "@/components/Icon/IconEdit";
import IconTrash from "@/components/Icon/IconTrash";
import { useNavigate, useSearchParams } from "@/lib/router-compat";
import { isLoggedIn } from "@/hooks/api/auth";
import { getFarmId } from "@/utils/farmId";
import {
  canCreateEntity,
  canDeleteEntity,
  canUpdateEntity,
} from "@/utils/permissions";
import { useSafeT } from "@/hooks/useSafeT";
import { useLivestock, type LivestockRow } from "@/hooks/api/livestock";
import LivestockFormModal from "./livestock_form";
import ConfirmDeleteModal from "./delete_livestock";
import {
  LIVESTOCK_SPECIES,
  LIVESTOCK_STATUSES,
  genderLabel,
  speciesEmoji,
  speciesLabel,
  speciesPlural,
  statusColor,
  statusDotColor,
  statusLabel,
} from "./livestockMeta";

type ViewMode = "card" | "table";

const LivestockList = () => {
  const { t } = useSafeT();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchKey = searchParams.toString();

  const role = isLoggedIn()?.role ?? "";
  const canCreate = canCreateEntity("livestock", role);
  const canUpdate = canUpdateEntity("livestock", role);
  const canDelete = canDeleteEntity("livestock", role);

  const {
    livestock,
    allLivestock,
    stats,
    loading,
    fetchLivestock,
    fetchAllLivestock,
    fetchStats,
    deleteLivestock,
  } = useLivestock();

  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [speciesFilter, setSpeciesFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<LivestockRow | null>(null);

  const farmId = getFarmId();

  useEffect(() => {
    fetchAllLivestock();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmId]);

  useEffect(() => {
    if (viewMode !== "table") return;
    fetchLivestock(searchParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKey, farmId, viewMode]);

  const cardList: LivestockRow[] = allLivestock?.data?.data ?? [];
  const tableList: LivestockRow[] = livestock?.data?.data ?? [];

  const filteredCardList = useMemo(() => {
    let result = cardList;
    if (speciesFilter) {
      result = result.filter((a) => a.species === speciesFilter);
    }
    if (statusFilter) {
      result = result.filter((a) => a.status === statusFilter);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((a) =>
        [
          a.tagNumber,
          a.breed,
          a.location,
          speciesLabel(a.species),
          a.farm?.name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }
    return result;
  }, [cardList, speciesFilter, statusFilter, searchQuery]);

  const speciesCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    cardList.forEach((a) => {
      counts[a.species] = (counts[a.species] || 0) + 1;
    });
    return counts;
  }, [cardList]);

  const refetch = useCallback(() => {
    fetchAllLivestock();
    fetchStats();
    if (viewMode === "table") fetchLivestock(searchParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, searchKey]);

  const handleDelete = async () => {
    if (!selected?.id) return;
    const ok = await deleteLivestock(selected.id);
    setIsDeleteOpen(false);
    setSelected(null);
    if (ok) refetch();
  };

  const openCreate = () => {
    setSelected(null);
    setIsFormOpen(true);
  };

  const openEdit = (row: LivestockRow, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelected(row);
    setIsFormOpen(true);
  };

  const openDelete = (row: LivestockRow, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelected(row);
    setIsDeleteOpen(true);
  };

  const columns: TableColumnV2<LivestockRow>[] = [
    {
      title: "Species",
      accessor: "species",
      render: (row) => (
        <div className="flex items-center gap-2">
          <span aria-hidden>{speciesEmoji(row.species)}</span>
          <span>{speciesLabel(row.species)}</span>
        </div>
      ),
    },
    {
      title: "Tag number",
      accessor: "tagNumber",
      render: (row) => (
        <div>
          <p className="font-medium">{row.tagNumber}</p>
          {row.breed && (
            <p className="text-xs text-gray-500">{capitalize(row.breed)}</p>
          )}
        </div>
      ),
    },
    {
      title: "Sex",
      accessor: "gender",
      render: (row) => <p>{genderLabel(row.gender, row.species)}</p>,
    },
    {
      title: "Status",
      accessor: "status",
      render: (row) => (
        <span className="inline-flex items-center gap-2">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: statusDotColor(row.status) }}
          />
          {statusLabel(row.status)}
        </span>
      ),
    },
    {
      title: "Weight (kg)",
      accessor: "weight",
      render: (row) => <p>{row.weight != null ? row.weight : "—"}</p>,
    },
    {
      title: "Location",
      accessor: "location",
      render: (row) => <p>{row.location || "—"}</p>,
    },
    {
      title: "Actions",
      accessor: "actions",
      render: (row) => (
        <div className="flex gap-2 justify-center items-center">
          {canUpdate && (
            <button type="button" onClick={(e) => openEdit(row, e)}>
              <IconEdit className="text-primary" />
            </button>
          )}
          {canDelete && (
            <button type="button" onClick={(e) => openDelete(row, e)}>
              <IconTrash className="text-danger" />
            </button>
          )}
          {!canUpdate && !canDelete && (
            <span className="text-xs text-gray-400">—</span>
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
              <button
                type="button"
                onClick={() => navigate("/account")}
                className="hover:text-gray-700 dark:hover:text-white"
              >
                {t("nav.dashboard")}
              </button>
            </li>
            <li className="before:content-['/'] before:px-1.5">
              <button
                type="button"
                onClick={() => navigate("/account/cattle")}
                className="hover:text-gray-700 dark:hover:text-white"
              >
                {t("pages.cattle")}
              </button>
            </li>
            <li className="before:content-['/'] before:px-1.5">
              <span className="text-black dark:text-white-light">
                {t("pages.livestock")}
              </span>
            </li>
          </ol>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {t("pages.livestock")}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t("pages.livestockIntro")}
          </p>
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
              {t("common.cards")}
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
              {t("common.table")}
            </button>
          </div>
          {canCreate && (
            <button
              type="button"
              onClick={openCreate}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <IconPlus className="w-5 h-5" />
              {t("pages.addLivestock")}
            </button>
          )}
        </div>
      </div>

      {(stats?.bySpecies?.length ?? 0) > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              {t("pages.totalAnimals")}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats?.totalAnimals ?? cardList.length}
            </p>
          </div>
          {stats?.bySpecies.map((row) => (
            <div
              key={row.species}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3"
            >
              <p className="text-xs uppercase tracking-wide text-gray-500">
                {speciesEmoji(row.species)} {speciesPlural(row.species)}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {row.animals}
              </p>
            </div>
          ))}
        </div>
      )}

      {viewMode === "card" && (
        <>
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              type="button"
              onClick={() => setSpeciesFilter("")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                speciesFilter === ""
                  ? "bg-primary text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {t("common.all")} ({cardList.length})
            </button>
            {LIVESTOCK_SPECIES.filter((s) => speciesCounts[s]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeciesFilter(s)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  speciesFilter === s
                    ? "bg-primary text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {speciesEmoji(s)} {speciesPlural(s)} ({speciesCounts[s]})
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mb-4 items-center">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t("pages.searchLivestock")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            >
              <option value="">{t("pages.allStatuses")}</option>
              {LIVESTOCK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </select>
          </div>

          {loading && cardList.length === 0 && (
            <p className="text-gray-500">{t("common.loading")}</p>
          )}

          {!loading && filteredCardList.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
              <p className="text-gray-500">{t("pages.noLivestock")}</p>
              {canCreate && cardList.length === 0 && (
                <button
                  type="button"
                  className="btn btn-primary mt-4"
                  onClick={openCreate}
                >
                  {t("pages.addFirstLivestock")}
                </button>
              )}
            </div>
          )}

          {filteredCardList.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCardList.map((a) => (
                <article
                  key={a.id}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex flex-col items-center text-center">
                      <span
                        className="text-3xl mb-1"
                        aria-label={speciesLabel(a.species)}
                      >
                        {speciesEmoji(a.species)}
                      </span>
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate w-full">
                        {a.tagNumber}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate w-full">
                        {speciesLabel(a.species)}
                        {a.breed ? ` · ${capitalize(a.breed)}` : ""}
                      </p>
                      <span
                        className={`mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(
                          a.status
                        )}`}
                      >
                        {statusLabel(a.status)}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <ScaleIcon className="w-4 h-4 shrink-0 text-gray-400" />
                        <span>
                          {a.weight != null ? `${a.weight} kg` : "—"} ·{" "}
                          {genderLabel(a.gender, a.species)}
                        </span>
                      </div>
                      {(a.location || a.farm?.name) && (
                        <div className="flex items-start gap-1.5">
                          <MapPinIcon className="w-4 h-4 shrink-0 text-gray-400 mt-0.5" />
                          <span className="line-clamp-2 text-left">
                            {a.location || a.farm?.name}
                          </span>
                        </div>
                      )}
                    </div>

                    {(canUpdate || canDelete) && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {canUpdate && (
                          <button
                            type="button"
                            onClick={(e) => openEdit(a, e)}
                            className="btn btn-outline-primary flex-1 min-w-0 py-1.5 text-xs font-medium"
                          >
                            {t("common.edit")}
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={(e) => openDelete(a, e)}
                            className="btn btn-outline-danger py-1.5 px-2 text-xs font-medium"
                          >
                            {t("common.delete")}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

          {cardList.length > 0 && (
            <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
              Showing {filteredCardList.length} of {cardList.length} animals
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
            tableName="Other livestock"
            currentPage={livestock?.data?.currentPage ?? 0}
            total={livestock?.data?.total}
            lastPage={(livestock?.data?.lastPage ?? 0) + 1}
            previousPage={livestock?.data?.previousPage}
            nextPage={livestock?.data?.nextPage}
          />
        </div>
      )}

      <LivestockFormModal
        isOpen={isFormOpen}
        animal={selected}
        onClose={() => {
          setIsFormOpen(false);
          setSelected(null);
        }}
        handleRefetch={refetch}
      />
      <ConfirmDeleteModal
        isOpen={isDeleteOpen}
        label={selected?.tagNumber}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelected(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default LivestockList;
