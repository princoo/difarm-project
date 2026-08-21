import React from "react";
import { IconType } from "react-icons";
import { useSafeT } from "@/hooks/useSafeT";

interface AnalyticsCardProps {
  icon: IconType;
  title: string;
  value: string | number;
}

export default function AnalyticsCard({
  icon: Icon,
  title,
  value,
}: AnalyticsCardProps) {
  const { t } = useSafeT();

  return (
    <div className="bg-white dark:bg-transparent rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <div
        className={`bg-primary-light dark:bg-primary/20 text-primary w-12 h-12 rounded-full flex items-center justify-center mb-4`}
      >
        <Icon size={24} />
      </div>

      <h3 className="dark:text-white text-sm font-medium mb-2">{title}</h3>

      <div className="text-3xl font-bold dark:text-white mb-3">{value}</div>
      <div className="text-xs text-gray-500">
        {t("dashboard.fromYear", { year: 2024 })}
      </div>
    </div>
  );
}
