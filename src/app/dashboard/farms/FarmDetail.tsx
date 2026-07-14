import { useEffect, useState } from "react";
import { useParams, useNavigate } from "@/lib/router-compat";
import { useGetFarmById } from "@/hooks/api/farms";
import { api, resolveApiBaseURL } from "@/hooks/api";
import DataTableV2, { TableColumnV2 } from "@/components/datatable";
import formatDateToLongForm from "@/utils/DateFormattter";
import { capitalize } from "lodash";
import IconHome from "@/components/Icon/IconHome";
import { setFarmId } from "@/utils/farmId";
import AssignManagerModal from "./assign_manager";
import FarmProfileSection, {
  FarmProfileData,
  unwrapFarmProfile,
} from "./FarmProfileSection";
import { isLoggedIn } from "@/hooks/api/auth";
import { isFarmAdmin, isSuperAdmin } from "@/utils/permissions";

export default function FarmDetail() {
  const { farmId } = useParams<{ farmId: string }>();
  const navigate = useNavigate();
  const {
    farm,
    loading: farmLoading,
    error: farmError,
    refetch: refetchFarm,
  } = useGetFarmById(farmId ?? "");

  const user = isLoggedIn();
  const canManageFarm = isSuperAdmin(user?.role) || isFarmAdmin(user?.role);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState<
    "profile" | "cattle" | "production" | "health"
  >("profile");
  const [productionSubTab, setProductionSubTab] = useState<"list" | "sales">("list");
  const [healthSubTab, setHealthSubTab] = useState<"vaccination" | "insemination" | "veterinarians">("vaccination");

  const [cattle, setCattle] = useState<any>({ data: [] });
  const [productions, setProductions] = useState<any[]>([]);
  const [productionTotals, setProductionTotals] = useState<any[]>([]);
  const [productionTransactions, setProductionTransactions] = useState<any[]>([]);
  const [vaccinations, setVaccinations] = useState<any>({ data: [] });
  const [inseminations, setInseminations] = useState<any>({ data: [] });
  const [veterinarians, setVeterinarians] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    if (farmId) {
      setFarmId(farmId);
    }
  }, [farmId]);

  useEffect(() => {
    if (!farmId) return;
    setDataLoading(true);
    const unwrap = (r: any) => (r?.data?.data !== undefined ? r.data : r);
    const unwrapList = (r: any) => {
      const d = r?.data?.data;
      if (Array.isArray(d)) return d;
      if (Array.isArray(r?.data)) return r.data;
      return [];
    };
    Promise.all([
      api.get(`/cattles/${farmId}`).then((r) => setCattle(unwrap(r))).catch(() => setCattle({ data: [] })),
      api.get(`/productions/${farmId}`).then((r) => setProductions(unwrapList(r))).catch(() => setProductions([])),
      api.get(`/production-totals/${farmId}`).then((r) => setProductionTotals(unwrapList(r))).catch(() => setProductionTotals([])),
      api.get(`/production-transaction/${farmId}`).then((r) => setProductionTransactions(unwrapList(r))).catch(() => setProductionTransactions([])),
      api.get(`/vaccinations/${farmId}`).then((r) => setVaccinations(unwrap(r))).catch(() => setVaccinations({ data: [] })),
      api.get(`/inserminations/${farmId}`).then((r) => setInseminations(unwrap(r))).catch(() => setInseminations({ data: [] })),
      api.get(`/veterinarians/${farmId}`).then((r) => setVeterinarians(unwrapList(r))).catch(() => setVeterinarians([])),
    ]).finally(() => setDataLoading(false));
  }, [farmId]);

  const cattleList = cattle?.data?.data ?? (Array.isArray(cattle?.data) ? cattle.data : []);
  const vaccinationList = vaccinations?.data?.data ?? (Array.isArray(vaccinations?.data) ? vaccinations.data : []);
  const inseminationList = inseminations?.data?.data ?? (Array.isArray(inseminations?.data) ? inseminations.data : []);

  const stats = {
    cattle: cattleList.length,
    production: productions.length,
    vaccination: vaccinationList.length,
    insemination: inseminationList.length,
    veterinarians: veterinarians.length,
  };

  const cattleColumns: TableColumnV2<any>[] = [
    { title: "Tag Number", accessor: "tagNumber", render: (row) => <p>{row?.tagNumber}</p> },
    { title: "Breed", accessor: "breed", render: (row) => <p>{capitalize(row?.breed)}</p> },
    { title: "Gender", accessor: "gender", render: (row) => <p>{capitalize(row?.gender)}</p> },
    { title: "Weight (Kg)", accessor: "weight", render: (row) => <p>{row?.weight ?? "—"}</p> },
    { title: "Status", accessor: "status", render: (row) => <span className="capitalize">{row?.status ?? "—"}</span> },
    { title: "Last Checkup", accessor: "lastCheckupDate", render: (row) => <p>{row?.lastCheckupDate ? formatDateToLongForm(row.lastCheckupDate) : "—"}</p> },
    { title: "DOB", accessor: "DOB", render: (row) => <p>{row?.DOB ? formatDateToLongForm(row.DOB) : "—"}</p> },
    { title: "Created", accessor: "createdAt", render: (row) => <p>{row?.createdAt ? formatDateToLongForm(row.createdAt) : "—"}</p> },
  ];

  const productionColumns: TableColumnV2<any>[] = [
    { title: "Cattle Tag", accessor: "cattle.tagNumber", render: (row) => <p>{row?.cattle?.tagNumber ?? "—"}</p> },
    { title: "Product", accessor: "productName", render: (row) => <p>{row?.productName}</p> },
    { title: "Quantity", accessor: "quantity", render: (row) => <p>{row?.quantity}</p> },
    { title: "Production Date", accessor: "productionDate", render: (row) => <p>{row?.productionDate ? formatDateToLongForm(row.productionDate) : "—"}</p> },
    { title: "Expiration", accessor: "expirationDate", render: (row) => <p>{row?.expirationDate ? formatDateToLongForm(row.expirationDate) : "—"}</p> },
  ];

  const transactionColumns: TableColumnV2<any>[] = [
    { title: "Product", accessor: "productType", render: (row) => <p>{row?.productType}</p> },
    { title: "Quantity sold", accessor: "quantity", render: (row) => <p>{row?.quantity}</p> },
    { title: "Sale value", accessor: "value", render: (row) => <p>{row?.value ?? "—"}</p> },
    { title: "Buyer", accessor: "consumer", render: (row) => <p>{row?.consumer ?? "—"}</p> },
    { title: "Date", accessor: "date", render: (row) => <p>{row?.date ? formatDateToLongForm(row.date) : "—"}</p> },
  ];

  const vaccinationColumns: TableColumnV2<any>[] = [
    { title: "Cattle", accessor: "cattle.tagNumber", render: (row) => <p>{row?.cattle?.tagNumber ?? "—"}</p> },
    { title: "Date", accessor: "date", render: (row) => <p>{row?.date ? formatDateToLongForm(row.date) : "—"}</p> },
    { title: "Vaccine Type", accessor: "vaccineType", render: (row) => <p>{row?.vaccineType}</p> },
    { title: "Veterinarian", accessor: "veterinarian.name", render: (row) => <p>{row?.veterinarian?.name ?? "—"}</p> },
    {
      title: "Document",
      accessor: "documentUrl",
      render: (row) =>
        row?.documentUrl ? (
          <a
            href={`${resolveApiBaseURL()}${row.documentUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline text-sm"
          >
            View scan
          </a>
        ) : (
          <p className="text-gray-400">—</p>
        ),
    },
  ];

  const inseminationColumns: TableColumnV2<any>[] = [
    { title: "Cattle", accessor: "cattle.tagNumber", render: (row) => <p>{row?.cattle?.tagNumber ?? "—"}</p> },
    { title: "Date", accessor: "date", render: (row) => <p>{row?.date ? formatDateToLongForm(row.date) : "—"}</p> },
    { title: "Method", accessor: "method", render: (row) => <p>{row?.method}</p> },
    { title: "Type", accessor: "type", render: (row) => <p>{row?.type}</p> },
    { title: "Veterinarian", accessor: "veterinarian.name", render: (row) => <p>{row?.veterinarian?.name ?? "—"}</p> },
  ];

  const vetColumns: TableColumnV2<any>[] = [
    { title: "Name", accessor: "name", render: (row) => <p>{row?.name}</p> },
    { title: "Email", accessor: "email", render: (row) => <p>{row?.email}</p> },
    { title: "Phone", accessor: "phone", render: (row) => <p>{row?.phone ?? "—"}</p> },
  ];

  if (farmLoading && !farm) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[200px]">
        <p className="text-gray-500">Loading farm...</p>
      </div>
    );
  }
  if (farmError || !farm) {
    return (
      <div className="p-4">
        <p className="text-danger">{farmError || "Farm not found."}</p>
        <button type="button" className="btn btn-primary mt-2" onClick={() => navigate("/account/farms")}>
          Back to Farms
        </button>
      </div>
    );
  }

  const farmData: FarmProfileData = unwrapFarmProfile(farm) ?? {};

  const farmName = String(farmData?.name ?? "Farm");
  const farmLocation = String(farmData?.location ?? "—");
  const ownerName = farmData?.owner?.fullname != null ? capitalize(String(farmData.owner.fullname)) : "—";
  const farmSize = String(farmData?.size ?? "—");
  const farmType = capitalize(String(farmData?.type ?? "—"));
  const statusLabel = farmData?.status ? "Activated" : "Pending";

  return (
    <div className="p-4">
      <ol className="flex text-gray-500 font-semibold dark:text-white-dark text-sm gap-1">
        <li>
          <button type="button" onClick={() => navigate("/account/farms")} className="hover:text-gray-500/70 flex items-center gap-1">
            <IconHome /> Farms
          </button>
        </li>
        <li className="before:content-['/'] before:px-1">
          <span className="text-black dark:text-white-light">{farmName}</span>
        </li>
      </ol>

      <div className="mt-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{farmName}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{farmLocation}</p>
            <p className="text-sm text-gray-500 mt-1">
              Owner: {ownerName} · Size: {farmSize} · Type: {farmType}
            </p>
            <span
              className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                farmData?.status ? "bg-success-light text-success" : "bg-warning-light text-warning"
              }`}
            >
              {statusLabel}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {canManageFarm && (
              <>
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => navigate(`/account/farms/${farmId}/edit`)}
                >
                  Edit farm
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsAssignOpen(true)}
                >
                  Assign manager
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-6">
          <div className="rounded-lg border border-gray-200 dark:border-gray-600 p-3 text-center">
            <p className="text-2xl font-bold text-primary">{stats.cattle}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Cattle</p>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-600 p-3 text-center">
            <p className="text-2xl font-bold text-primary">{stats.production}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Production</p>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-600 p-3 text-center">
            <p className="text-2xl font-bold text-primary">{stats.vaccination}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Vaccinations</p>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-600 p-3 text-center">
            <p className="text-2xl font-bold text-primary">{stats.insemination}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Inseminations</p>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-600 p-3 text-center">
            <p className="text-2xl font-bold text-primary">{stats.veterinarians}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Veterinarians</p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex border-b border-gray-200 dark:border-gray-700 gap-2 flex-wrap">
          {(["profile", "cattle", "production", "health"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveMainTab(tab)}
              className={`px-4 py-2 font-medium text-sm rounded-t-lg ${
                activeMainTab === tab
                  ? "bg-primary text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {capitalize(tab)}
            </button>
          ))}
        </div>

        <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-b-lg p-4 bg-white dark:bg-gray-800 min-h-[200px]">
          {activeMainTab === "profile" && (
            <FarmProfileSection farm={farmData} showActions={false} />
          )}

          {activeMainTab === "cattle" && (
            <>
              <h2 className="text-lg font-semibold mb-3">Cattle list</h2>
              <DataTableV2
                columns={cattleColumns}
                data={cattleList}
                isLoading={dataLoading}
                tableName="Cattle"
                currentPage={1}
                total={cattleList.length}
                lastPage={1}
                previousPage={0}
                nextPage={0}
              />
            </>
          )}

          {activeMainTab === "production" && (
            <>
              <div className="flex gap-2 mb-4">
                {(["list", "sales"] as const).map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setProductionSubTab(sub)}
                    className={`px-3 py-1.5 text-sm rounded ${
                      productionSubTab === sub ? "bg-primary text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {sub === "list" ? "Overview" : "Sales"}
                  </button>
                ))}
              </div>
              {productionSubTab === "list" && (
                <>
                  {productionTotals.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                      {productionTotals.map((row: any) => (
                        <div
                          key={row.id}
                          className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4"
                        >
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            {row.productType}
                          </p>
                          <p className="text-2xl font-bold mt-1">{row.totalQuantity ?? 0}</p>
                          <p className="text-xs text-gray-500">Stock on hand</p>
                          <p className="text-sm mt-2">
                            Sale price:{" "}
                            {row.pricePerUnit != null
                              ? `${Number(row.pricePerUnit).toLocaleString()} / unit`
                              : "Not set"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  <DataTableV2
                    columns={productionColumns}
                    data={productions}
                    isLoading={dataLoading}
                    tableName="Production"
                    currentPage={1}
                    total={productions.length}
                    lastPage={1}
                    previousPage={0}
                    nextPage={0}
                  />
                </>
              )}
              {productionSubTab === "sales" && (
                <DataTableV2
                  columns={transactionColumns}
                  data={productionTransactions}
                  isLoading={dataLoading}
                  tableName="Sales"
                  currentPage={1}
                  total={productionTransactions.length}
                  lastPage={1}
                  previousPage={0}
                  nextPage={0}
                />
              )}
            </>
          )}

          {activeMainTab === "health" && (
            <>
              <div className="flex gap-2 mb-4">
                {(["vaccination", "insemination", "veterinarians"] as const).map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setHealthSubTab(sub)}
                    className={`px-3 py-1.5 text-sm rounded ${
                      healthSubTab === sub ? "bg-primary text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {capitalize(sub)}
                  </button>
                ))}
              </div>
              {healthSubTab === "vaccination" && (
                <DataTableV2
                  columns={vaccinationColumns}
                  data={vaccinationList}
                  isLoading={dataLoading}
                  tableName="Vaccinations"
                  currentPage={1}
                  total={vaccinationList.length}
                  lastPage={1}
                  previousPage={0}
                  nextPage={0}
                />
              )}
              {healthSubTab === "insemination" && (
                <DataTableV2
                  columns={inseminationColumns}
                  data={inseminationList}
                  isLoading={dataLoading}
                  tableName="Inseminations"
                  currentPage={1}
                  total={inseminationList.length}
                  lastPage={1}
                  previousPage={0}
                  nextPage={0}
                />
              )}
              {healthSubTab === "veterinarians" && (
                <DataTableV2
                  columns={vetColumns}
                  data={veterinarians}
                  isLoading={dataLoading}
                  tableName="Veterinarians"
                  currentPage={1}
                  total={veterinarians.length}
                  lastPage={1}
                  previousPage={0}
                  nextPage={0}
                />
              )}
            </>
          )}
        </div>
      </div>

      <AssignManagerModal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        farm={{
          id: farmId,
          name: farmName,
          status: farmData.status,
          managerId: farmData.managerId,
          managerLinks: farmData.managerLinks,
        }}
        handleRefetch={refetchFarm}
      />
    </div>
  );
}
