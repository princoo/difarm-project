import { useEffect, useMemo, useState } from "react";
import { useFarms } from "@/hooks/api/farms";
import { ALL_FARMS_SCOPE, clearFarmId, getFarmId, setFarmId } from "@/utils/farmId";
import { getDashboardMode } from "@/utils/dashboardMode";
import { useSafeT } from "@/hooks/useSafeT";
import { isLoggedIn } from "@/hooks/api/auth";
import { isSuperAdmin } from "@/utils/permissions";

type Props = {
  className?: string;
  /** Hide the "All farms" option — use on pages that require a concrete farm. */
  requireFarm?: boolean;
};

export default function HeaderFarmSelector({ className, requireFarm = false }: Props) {
  const { t } = useSafeT();
  const user = isLoggedIn();
  const superAdmin = isSuperAdmin(user?.role);
  const { farms, loading, fetchFarms } = useFarms({ autoFetch: true });
  const [value, setValue] = useState<string>(() => getFarmId() ?? ALL_FARMS_SCOPE);

  useEffect(() => {
    fetchFarms();
  }, [fetchFarms]);

  useEffect(() => {
    const sync = () => setValue(getFarmId() ?? ALL_FARMS_SCOPE);
    window.addEventListener("difarm-farm-changed", sync);
    return () => window.removeEventListener("difarm-farm-changed", sync);
  }, []);

  const dashboardMode = getDashboardMode();
  const options = useMemo(() => {
    const list = Array.isArray(farms?.data) ? farms.data : farms?.data?.data ?? [];
    if (!Array.isArray(list)) return [];
    return list
      .filter((f: any) => {
        if (!superAdmin || !dashboardMode) return true;
        if (dashboardMode === "AGRICULTURE") return f.farmCategory === "AGRICULTURE";
        if (dashboardMode === "LIVESTOCK") return f.farmCategory !== "AGRICULTURE";
        return true;
      })
      .map((f: any) => ({
        id: f.id,
        name: f.name || t("dashboard.unnamedFarm"),
        status: f.status,
      }));
  }, [farms, superAdmin, dashboardMode, t]);

  if (!superAdmin && !requireFarm) return null;

  const handleChange = (next: string) => {
    setValue(next);
    if (next === ALL_FARMS_SCOPE) {
      if (requireFarm) return;
      clearFarmId();
    } else {
      setFarmId(next);
    }
  };

  return (
    <select
      value={requireFarm ? value === ALL_FARMS_SCOPE ? "" : value : value}
      onChange={(e) => handleChange(e.target.value || ALL_FARMS_SCOPE)}
      disabled={loading}
      className={
        className ??
        "form-select min-w-[180px] max-w-[240px] rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800"
      }
    >
      {!requireFarm && <option value={ALL_FARMS_SCOPE}>{t("dashboard.allFarms")}</option>}
      {requireFarm && !getFarmId() && (
        <option value="">{t("dashboard.selectFarm")}</option>
      )}
      {options.map((f) => (
        <option key={f.id} value={f.id}>
          {f.name}
          {f.status === false ? ` ${t("dashboard.inactive")}` : ""}
        </option>
      ))}
    </select>
  );
}
