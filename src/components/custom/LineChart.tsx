import React from "react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface DataPoint {
  month: string;
  monthNumber: number;
  count: number;
  [key: string]: any;
}

interface LineChartProps {
  data: DataPoint[];
  title?: string;
  dataKey?: string;
  xAxisKey?: string;
  lineColor?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  strokeWidth?: number;
  dotSize?: number;
  className?: string;
}

export default function LineChart({
  data,
  title,
  dataKey = "count",
  xAxisKey = "month",
  lineColor = "#3b82f6",
  height = 300,
  showGrid = true,
  showLegend = false,
  showTooltip = true,
  strokeWidth = 2,
  dotSize = 4,
  className = "",
}: LineChartProps) {
  // Format month names for better display (first 3 letters)
  const formattedData = data.map((item) => ({
    ...item,
    displayMonth: item.month.substring(0, 3),
  }));
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.month}</p>
          <p className="text-sm text-gray-600">
            <span className="font-medium" style={{ color: lineColor }}>
              {dataKey}: {payload[0].value}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`bg-white dark:bg-transparent rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm ${className}`}
    >
      {title && (
        <h3 className="text-lg font-semibold dark:text-white mb-4">{title}</h3>
      )}

      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart
          data={formattedData}
          margin={{
            top: 5,
            right: 0,
            left: -30,
            bottom: 5,
          }}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />}

          <XAxis
            dataKey="displayMonth"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#64748b" }}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#64748b" }}
          />

          {showTooltip && <Tooltip content={<CustomTooltip />} />}

          {showLegend && <Legend />}

          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={lineColor}
            strokeWidth={strokeWidth}
            dot={{ fill: lineColor, strokeWidth: 2, r: dotSize }}
            activeDot={{ r: dotSize + 2, stroke: lineColor, strokeWidth: 2 }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
