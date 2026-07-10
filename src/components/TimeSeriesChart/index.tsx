import { Card, Text } from "@mantine/core";
import {
  AreaChart as ReAreaChart,
  Area,
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type Props = {
  type: "area" | "bar";
  chartData: any[];
  dataKeys: string[];
};
interface TimeSeriesData {
  name: string;
  data: number[];
}

interface TimeSeriesChartProps {
  labels: string[];
  series: TimeSeriesData[];
  title?: string;
  type?: "area" | "bar";
  loading?: boolean;
}

export function TimeSeriesChart({
  labels,
  series,
  title,
  type = "area",
  loading,
}: TimeSeriesChartProps) {
  // Transform data for Mantine charts format
  const chartData = labels.map((label, index) => {
    const dataPoint: any = { month: label };
    series.forEach((s) => {
      dataPoint[s.name] = s.data[index] || 0;
    });
    return dataPoint;
  });

  const dataKeys = series.map((s) => s.name);

  return (
    <Card shadow="sm" radius="md" withBorder>
      {title && (
        <Text size="lg" fw={600} mb="md">
          {title}
        </Text>
      )}

      {loading ? (
        <Text c="dimmed" ta="center" py="xl">
          Loading...
        </Text>
      ) : (
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height={260}>
            {type === "area" ? (
              <ReAreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                {dataKeys.map((key, idx) => (
                  <Area
                    key={key}
                    type="linear"
                    dataKey={key}
                    stroke="#2563eb" // Tailwind blue-600
                    fill="#93c5fd" // Tailwind blue-300
                  />
                ))}
              </ReAreaChart>
            ) : (
              <ReBarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                {dataKeys.map((key, idx) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    fill="#2563eb" // Tailwind blue-600
                  />
                ))}
              </ReBarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
