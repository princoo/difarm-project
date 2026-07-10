import { useEffect, useState } from "react";
import { DateSelector } from "@/components/DateSelector";
import { farmApi, InseminationData, VaccinationData } from "@/lib/api";
import LineChart from "@/components/custom/LineChart";
import ChartWrapperShimmerCard from "@/components/custom/loaders/chart-wrapper-shimmer";
import { getReadFarmScope } from "@/utils/farmId";
import { isLoggedIn } from "@/hooks/api/auth";

interface SeasonalData {
  insemination: InseminationData;
  vaccination: VaccinationData;
}

type Props = {
  farmScope?: string | null;
};

export default function OverTime({ farmScope }: Props) {
  const user = isLoggedIn();
  const resolvedScope =
    farmScope ?? getReadFarmScope(user?.role ?? undefined);
  const [value, setValue] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seasonalData, setSeasonalData] = useState<SeasonalData | null>(null);

  useEffect(() => {
    if (!resolvedScope) {
      setError("No farm selected.");
      setSeasonalData(null);
      return;
    }

    let cancelled = false;

    async function getFarmMetrics() {
      setLoading(true);
      setError(null);
      try {
        const year = String(value);
        const [insemination, vaccination] = await Promise.all([
          farmApi.getInseminationsByYear(resolvedScope!, year),
          farmApi.getVaccinationsByYear(resolvedScope!, year),
        ]);

        if (cancelled) return;
        setSeasonalData({
          insemination: insemination.data,
          vaccination: vaccination.data,
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
  }, [value, resolvedScope]);

  if (!resolvedScope) {
    return (
      <p className="mt-5 text-gray-600 dark:text-gray-400">
        No farm selected. Choose a farm to view health and breeding charts.
      </p>
    );
  }

  return (
    <div className="mt-5 p-2">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <h1 className="text-lg dark:text-white font-medium">
          Health & Breeding Records
        </h1>
        <div className="w-36">
          <DateSelector
            type="year"
            value={String(value)}
            onChange={(year) => setValue(Number(year))}
          />
        </div>
      </div>

      <div className="mt-5">
        {loading && (
          <div className="flex flex-col gap-5">
            <ChartWrapperShimmerCard />
            <ChartWrapperShimmerCard />
          </div>
        )}
        {error && <div>{error}</div>}
        {seasonalData && !loading && !error && (
          <div className="flex flex-col gap-5">
            <LineChart
              data={seasonalData?.insemination.monthlyData || []}
              title="Insemination Records"
              dataKey="count"
              lineColor="#3b82f6"
              height={400}
              showGrid={true}
              showTooltip={true}
              className="w-full"
            />
            <LineChart
              data={seasonalData?.vaccination.monthlyData || []}
              title="Vaccination Records"
              dataKey="count"
              lineColor="#3b82f6"
              height={400}
              showGrid={true}
              showTooltip={true}
              className="w-full"
            />
          </div>
        )}
      </div>
    </div>
  );
}
