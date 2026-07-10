import React from 'react';

interface ShimmerCardProps {
  variant?: 'analytics' | 'breakdown' | 'chart';
  height?: number;
  className?: string;
}

export default function ChartWrapperShimmerCard({ 
  variant = 'analytics', 
  height = 200,
  className = '' 
}: Readonly<ShimmerCardProps>) {
  const shimmerClass = "animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 rounded";

  if (variant === 'analytics') {
    return (
      <div className={`bg-white dark:bg-transparent rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm ${className}`}>
        {/* Chart Title */}
        <div className={`${shimmerClass} h-6 w-48 mb-4`}></div>
        
        {/* Chart Area */}
        <div className={`${shimmerClass} w-full mb-4`} style={{ height: `${height}px` }}>
          <div className="flex items-end justify-between h-full p-4 space-x-2">
            {/* Simulated chart bars */}
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="bg-gray-100 dark:bg-gray-800 rounded-t"
                style={{
                  height: `${Math.random() * 60 + 20}%`,
                  width: '6%'
                }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'chart') {
    return (
      <div className={`bg-white dark:bg-transparent rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm ${className}`}>
        {/* Chart Title */}
        <div className={`${shimmerClass} h-6 w-48 mb-4`}></div>
        
        {/* Chart Area */}
        <div className={`${shimmerClass} w-full mb-4`} style={{ height: `${height}px` }}>
          <div className="flex items-end justify-between h-full p-4 space-x-2">
            {/* Simulated chart bars */}
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="bg-gray-100 rounded-t"
                style={{
                  height: `${Math.random() * 60 + 20}%`,
                  width: '6%'
                }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'breakdown') {
    return (
      <div className={`bg-white dark:bg-transparent rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm ${className}`}>
        {/* Icon */}
        <div className={`${shimmerClass} w-12 h-12 rounded-full mb-4`}></div>

        {/* Title */}
        <div className={`${shimmerClass} h-4 w-24 mb-2`}></div>

        {/* Total Value */}
        <div className={`${shimmerClass} h-8 w-16 mb-4`}></div>

        {/* Breakdown Items */}
        <div className="space-y-3">
          {/* Male Count */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`${shimmerClass} w-3 h-3 rounded-full`}></div>
              <div className={`${shimmerClass} h-3 w-8`}></div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`${shimmerClass} h-3 w-6`}></div>
              <div className={`${shimmerClass} h-3 w-8`}></div>
            </div>
          </div>

          {/* Female Count */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`${shimmerClass} w-3 h-3 rounded-full`}></div>
              <div className={`${shimmerClass} h-3 w-12`}></div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`${shimmerClass} h-3 w-6`}></div>
              <div className={`${shimmerClass} h-3 w-8`}></div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className={`${shimmerClass} h-2 w-full rounded-full`}></div>
          </div>
        </div>
      </div>
    );
  }

  // Default analytics variant
  return (
    <div className={`bg-white dark:bg-transparent rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm ${className}`}>
      {/* Icon */}
      <div className={`${shimmerClass} w-12 h-12 rounded-full mb-4`}></div>

      {/* Title */}
      <div className={`${shimmerClass} h-4 w-24 mb-2`}></div>

      {/* Value */}
      <div className={`${shimmerClass} h-8 w-16 mb-3`}></div>

      {/* Trend */}
      <div className="flex items-center gap-1">
        <div className={`${shimmerClass} w-4 h-4 rounded`}></div>
        <div className={`${shimmerClass} h-3 w-32`}></div>
      </div>
    </div>
  );
}