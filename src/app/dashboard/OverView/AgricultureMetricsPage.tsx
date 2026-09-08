import { useEffect } from "react";
import { Link } from "@/lib/router-compat";
import { useSafeT } from "@/hooks/useSafeT";
import { usePlantings } from "@/hooks/api/agriculture";

export default function AgricultureMetricsPage() {
  const { t } = useSafeT();
  const { stats, fetchStats } = usePlantings();

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const cards = [
    { label: t("agriculture.activePlantings"), value: stats?.activePlantings ?? 0, to: "/account/plantings" },
    { label: t("agriculture.fieldsInUse"), value: stats?.fieldCount ?? 0, to: "/account/fields" },
    { label: t("agriculture.cropTypesCount"), value: stats?.cropTypeCount ?? 0, to: "/account/crop-types" },
    { label: t("agriculture.totalHarvests"), value: stats?.harvestCount ?? 0, to: "/account/harvests" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="panel hover:shadow-md transition">
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className="text-3xl font-bold text-primary mt-1">{c.value}</p>
          </Link>
        ))}
      </div>
      {(stats?.upcomingHarvests?.length ?? 0) > 0 && (
        <div className="panel">
          <h2 className="text-lg font-semibold mb-3">{t("agriculture.upcomingHarvests")}</h2>
          <ul className="space-y-2">
            {stats.upcomingHarvests.map((p: any) => (
              <li key={p.id} className="text-sm flex flex-wrap gap-2">
                <span className="font-medium">{p.cropType?.name}</span>
                <span className="text-gray-500">— {p.field?.name}</span>
                <span className="text-teal-700">{p.expectedHarvestDate ? new Date(p.expectedHarvestDate).toLocaleDateString() : ""}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
