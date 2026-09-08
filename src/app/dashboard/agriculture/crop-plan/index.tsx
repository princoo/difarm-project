import { useEffect, useState } from "react";
import { useSafeT } from "@/hooks/useSafeT";
import FarmCategoryGuard from "@/components/auth/FarmCategoryGuard";
import { useCropPlan } from "@/hooks/api/agriculture";

export default function CropPlanPage() {
  const { t } = useSafeT();
  const year = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(year);
  const { plan, loading, fetchPlan } = useCropPlan();

  useEffect(() => { fetchPlan(selectedYear); }, [fetchPlan, selectedYear]);

  const byField = plan?.byField ?? [];

  return (
    <FarmCategoryGuard require="AGRICULTURE">
      <div className="panel">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl font-semibold">{t("agriculture.cropPlanTitle")}</h1>
            <p className="text-sm text-gray-500">{t("agriculture.cropPlanSubtitle")}</p>
          </div>
          <select className="form-select w-auto" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
            {[year - 1, year, year + 1].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        {loading ? <p>{t("common.loading")}</p> : (
          <div className="space-y-6">
            {byField.length === 0 && <p className="text-gray-500">{t("agriculture.noCropPlan")}</p>}
            {byField.map(({ field, plantings }: any) => (
              <div key={field.id} className="border rounded-lg p-4 dark:border-gray-700">
                <h2 className="font-semibold text-lg mb-3">{field.name}</h2>
                {plantings.length === 0 ? (
                  <p className="text-sm text-gray-500">{t("agriculture.noPlantingsInField")}</p>
                ) : (
                  <div className="space-y-2">
                    {plantings.map((p: any) => (
                      <div key={p.id} className="flex flex-wrap items-center gap-3 text-sm border-l-4 border-green-600 pl-3 py-1">
                        <span className="font-medium">{p.cropType?.name}</span>
                        <span className="text-gray-500">{t("agriculture.planted")}: {new Date(p.plantedDate).toLocaleDateString()}</span>
                        {p.expectedHarvestDate && (
                          <span className="text-gray-500">{t("agriculture.expectedHarvest")}: {new Date(p.expectedHarvestDate).toLocaleDateString()}</span>
                        )}
                        <span className="badge bg-primary">{p.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </FarmCategoryGuard>
  );
}
