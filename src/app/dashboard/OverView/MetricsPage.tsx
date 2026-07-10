import { DataTotals, farmApi, GenderData } from "@/lib/api";
import { useEffect, useState } from "react";
import MetricsSection from "./components/MetricsSection";
import { MetricCardsShimmer } from "@/components/custom/loaders/cards-shimmer";
import { getReadFarmScope } from "@/utils/farmId";
import { isLoggedIn } from "@/hooks/api/auth";
import { isSuperAdmin } from "@/utils/permissions";
import { Link } from "@/lib/router-compat";

export interface MetricsData {
  cattleGenders: GenderData;
  totalVaccinations: DataTotals;
  totalInseminations: DataTotals;
}

type Props = {
  /** Explicit scope from parent (super admin filter). Falls back to storage. */
  farmScope?: string | null;
};

export default function MetricsPage({ farmScope }: Props) {
  const user = isLoggedIn();
  const superAdmin = isSuperAdmin(user?.role);
  const resolvedScope =
    farmScope ?? getReadFarmScope(user?.role ?? undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);

  useEffect(() => {
    if (!resolvedScope) {
      setError("No farm selected. Choose a farm from the menu.");
      setMetrics(null);
      return;
    }

    let cancelled = false;

    async function getFarmMetrics() {
      setLoading(true);
      setError(null);
      try {
        const [cattleGenders, totalVaccinations, totalInseminations] =
          await Promise.all([
            farmApi.getCattlesByGender(resolvedScope!),
            farmApi.getVaccinationsTotal(resolvedScope!),
            farmApi.getInseminationsTotal(resolvedScope!),
          ]);

        if (cancelled) return;
        setMetrics({
          cattleGenders: cattleGenders.data,
          totalVaccinations: totalVaccinations.data,
          totalInseminations: totalInseminations.data,
        });
      } catch (err: unknown) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Something went wrong";
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    getFarmMetrics();
    return () => {
      cancelled = true;
    };
  }, [resolvedScope]);

  if (!resolvedScope) {
    return (
      <div className="rounded-lg border border-teal-100 bg-teal-50/60 p-6 dark:border-teal-900 dark:bg-teal-950/30">
        <p className="text-gray-700 dark:text-gray-300">
          {superAdmin
            ? "No farm is selected. Use the farm filter above or open Farms."
            : "No farm selected. Choose a farm to view dashboard metrics."}
        </p>
        {superAdmin && (
          <Link
            to="/account/farms"
            className="mt-3 inline-block text-sm font-medium text-teal-700 hover:text-teal-800 dark:text-teal-300"
          >
            Go to Farms →
          </Link>
        )}
      </div>
    );
  }
  if (loading) return <MetricCardsShimmer />;
  if (error) return <p className="text-red-600">Error: {error}</p>;
  return <MetricsSection metrics={metrics} />;
}
