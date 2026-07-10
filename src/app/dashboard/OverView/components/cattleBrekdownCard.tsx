import React from "react";
import { IconType } from "react-icons";

interface CattleBreakdownCardProps {
  icon: IconType;
  title: string;
  totalValue: number;
  maleCount: number;
  femaleCount: number;
}

export default function CattleBreakdownCard({
  icon: Icon,
  title,
  totalValue,
  maleCount,
  femaleCount,
}: CattleBreakdownCardProps) {
  const malePercentage =
    totalValue > 0 ? Math.round((maleCount / totalValue) * 100) : 0;
  const femalePercentage =
    totalValue > 0 ? Math.round((femaleCount / totalValue) * 100) : 0;

  return (
    <div className=" rounded-xl border bg-white dark:bg-transparent border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      {/* Icon */}
      <div
        className={` bg-primary-light dark:bg-primary/20 text-primary w-12 h-12 rounded-full flex items-center justify-center mb-4`}
      >
        <Icon size={24} />
      </div>

      {/* Title */}
      <h3 className=" text-sm dark:text-white font-medium mb-2">{title}</h3>

      {/* Total Value */}
      <div className="text-3xl dark:text-white font-bold mb-4">{totalValue}</div>

      {/* Breakdown */}
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-sm">Male</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold ">
              {maleCount}
            </span>
            <span className="text-xs">({malePercentage}%)</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-1"> 
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-pink-500"></div>
            <span className="text-sm">Female</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold ">
              {femaleCount}
            </span>
            <span className="text-xs">({femalePercentage}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
