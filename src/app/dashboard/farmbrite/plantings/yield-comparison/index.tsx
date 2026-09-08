import { useEffect } from "react";
import { usePlantings } from "@/hooks/api/agriculture";
import { useSafeT } from "@/hooks/useSafeT";
import FarmbriteModuleShell from "../../FarmbriteModuleShell";

export default function YieldComparisonPage() {
  const { t } = useSafeT();
  const { items, fetchAll, loading } = usePlantings();

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const withHarvests = items.filter((p) => (p.harvests?.length ?? 0) > 0);

  return (
    <FarmbriteModuleShell titleKey="nav.yieldComparison" subtitleKey="farmbrite.yieldComparisonSubtitle">
      {loading ? (
        <p className="text-sm text-gray-500">{t("common.loading")}</p>
      ) : withHarvests.length === 0 ? (
        <p className="text-sm text-gray-500">{t("farmbrite.noYieldData")}</p>
      ) : (
        <div className="table-responsive">
          <table className="table-hover">
            <thead>
              <tr>
                <th>{t("agriculture.cropName")}</th>
                <th>{t("agriculture.fieldName")}</th>
                <th>{t("agriculture.quantity")}</th>
                <th>{t("agriculture.harvestDate")}</th>
              </tr>
            </thead>
            <tbody>
              {withHarvests.flatMap((p) =>
                (p.harvests ?? []).map((h: any) => (
                  <tr key={h.id}>
                    <td>{p.cropType?.name}</td>
                    <td>{p.field?.name}</td>
                    <td>{h.quantity} {h.unit}</td>
                    <td>{h.harvestDate ? new Date(h.harvestDate).toLocaleDateString() : "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </FarmbriteModuleShell>
  );
}
