import { useEffect } from "react";
import { useSafeT } from "@/hooks/useSafeT";
import FarmCategoryGuard from "@/components/auth/FarmCategoryGuard";
import { useFarmHarvests } from "@/hooks/api/agriculture";

export default function HarvestsPage() {
  const { t } = useSafeT();
  const { items, loading, fetchAll } = useFarmHarvests();

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <FarmCategoryGuard require="AGRICULTURE">
      <div className="panel">
        <h1 className="text-xl font-semibold mb-1">{t("agriculture.harvestsTitle")}</h1>
        <p className="text-sm text-gray-500 mb-5">{t("agriculture.harvestsSubtitle")}</p>
        {loading ? <p>{t("common.loading")}</p> : (
          <div className="table-responsive">
            <table className="table-hover">
              <thead>
                <tr>
                  <th>{t("agriculture.harvestDate")}</th>
                  <th>{t("agriculture.cropName")}</th>
                  <th>{t("agriculture.fieldName")}</th>
                  <th>{t("agriculture.quantity")}</th>
                  <th>{t("agriculture.qualityGrade")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id}>
                    <td>{row.harvestDate ? new Date(row.harvestDate).toLocaleDateString() : "—"}</td>
                    <td>{row.planting?.cropType?.name ?? "—"}</td>
                    <td>{row.planting?.field?.name ?? "—"}</td>
                    <td>{row.quantity} {row.unit}</td>
                    <td>{row.qualityGrade || "—"}</td>
                  </tr>
                ))}
                {items.length === 0 && <tr><td colSpan={5} className="text-center text-gray-500 py-6">{t("agriculture.noHarvests")}</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </FarmCategoryGuard>
  );
}
