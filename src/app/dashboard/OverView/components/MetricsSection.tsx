import React from "react";
import { MetricsData } from "../MetricsPage";
import { CgThermometer } from "react-icons/cg";
import { GiCow } from "react-icons/gi";
import { MdOutlineVaccines } from "react-icons/md";
import AnalyticsCard from "./analyticsCard";
import CattleBreakdownCard from "./cattleBrekdownCard";

export default function MetricsSection({
  metrics,
}: {
  readonly metrics: MetricsData | null;
}) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <CattleBreakdownCard
        icon={GiCow}
        title="Total Cattles"
        totalValue={
          (metrics?.cattleGenders.femaleCount || 0) +
          (metrics?.cattleGenders.maleCount || 0)
        }
        maleCount={metrics?.cattleGenders.maleCount || 0}
        femaleCount={metrics?.cattleGenders.femaleCount || 0}
      />
      <AnalyticsCard
        icon={CgThermometer}
        title="Total Inseminations"
        value={metrics?.totalInseminations.total || 0}
      />
      <AnalyticsCard
        icon={MdOutlineVaccines}
        title="Total Vacinations"
        value={metrics?.totalVaccinations.total || 0}
      />
    </div>
  );
}
