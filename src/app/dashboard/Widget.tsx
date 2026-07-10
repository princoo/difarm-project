import {
  useGeneralStatistics,
  useStatisticsByFarmId,
  useGetFarmSummary,
} from "@/hooks/api/statistics";
import React, { useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import {
  FaChartLine,
  FaWarehouse,
  FaSyringe,
  FaProcedures,
  FaCrow,
} from "react-icons/fa";
import { useParams } from "@/lib/router-compat";
import Error500 from "@/errors/500Error";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { GiCow } from "react-icons/gi";
import { getFarmId } from "@/utils/farmId";

const StatisticsDashboard = () => {
  const farmId = getFarmId();
  const [cattleSummYear, setcattleSummYear] = useState<string>(
    new Date().getFullYear().toString()
  );
  const [yearChangeLoading, setYearChangeLoading] = useState<boolean>(false);

  const {
    getCattleSummary,
    cattleStatistics,
    loading: cattleSummLoading,
    error: cattleSummError,
  } = useGetFarmSummary();

  useEffect(() => {
    if (!farmId) return;
    getCattleSummary(cattleSummYear, farmId).finally(() =>
      setYearChangeLoading(false)
    );
  }, [cattleSummYear, farmId]);

  function handlecattleSummYearChange(e: any) {
    setcattleSummYear(e.target.value);
    setYearChangeLoading(true);
  }

  if (cattleSummLoading && !yearChangeLoading)
    return (
      <div className="text-center text-lg dark:text-white">Loading...</div>
    );

  if (!cattleStatistics)
    return (
      <div className="text-center text-lg dark:text-white">
        No data available
      </div>
    );

  const SectionCard = ({ icon, title, color, children }: any) => (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border-l-4 p-4 border-${color}-500 dark:border-${color}-400`}
    >
      <div className="flex items-center mb-4">
        {icon}
        <h3 className="text-lg font-semibold ml-2 dark:text-white">{title}</h3>
      </div>
      <div className="grid gap-2">{children}</div>
    </div>
  );

  const StatisticCard = ({ label, value, percentage }: any) => (
    <div
      className={`p-3 shadow-sm flex justify-between items-center rounded-md ${
        label === "Total" || label === "Total Quantity"
          ? "bg-blue-100 border border-blue-300 dark:bg-blue-900 dark:border-blue-700"
          : "bg-gray-100 dark:bg-gray-700"
      }`}
    >
      <p
        className={`text-sm font-medium ${
          label === "Total" || label === "Total Quantity"
            ? "text-blue-700 dark:text-blue-300"
            : "text-gray-600 dark:text-gray-300"
        }`}
      >
        {label}
      </p>
      <div className="text-right">
        <p
          className={`text-md font-semibold ${
            label === "Total" || label === "Total Quantity"
              ? "text-blue-700 dark:text-blue-300"
              : "dark:text-white"
          }`}
        >
          {value}
        </p>
        {percentage !== undefined && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {percentage.toFixed(2)}%
          </p>
        )}
      </div>
    </div>
  );

  return (
    <ErrorBoundary FallbackComponent={Error500}>
      <div className="graph-card max-w-4xl mx-auto px-4 py-6 dark:bg-gray-800 bg-white shadow-lg dark:border-none border-l-4 rounded-lg">
        <div className="header mx-8 flex flex-wrap items-center justify-between">
          <h2 className="text-base font-semibold text-green-500 flex items-center gap-2">
            <GiCow className="text-2xl" />
            <span>Cattles</span>
          </h2>
          <div>
            <select
              id="type"
              className="mt-1 block w-full px-3 py-2 border text-gray-400 border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
              value={cattleSummYear}
              onChange={(e) => handlecattleSummYearChange(e)}
            >
              <option value="2022">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>
        </div>

        <ResponsiveContainer
          width="100%"
          height={300}
          className={`${yearChangeLoading ? "opacity-40" : ""}`}
        >
          <LineChart
            width={730}
            height={250}
            data={cattleStatistics?.data}
            margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#228b22"
              name="Cattles"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ErrorBoundary>
  );
};

export default StatisticsDashboard;
