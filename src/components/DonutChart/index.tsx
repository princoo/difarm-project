import { RingProgress, Text, Group, Card } from "@mantine/core";

interface DonutChartData {
  label: string;
  value: number;
  color?: string;
}

interface DonutChartProps {
  data: DonutChartData[];
  title?: string;
  loading?: boolean;
}

export function DonutChart({ data, title, loading }: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const chartData = data.map((item, index) => ({
    value: total > 0 ? (item.value / total) * 100 : 0,
    color: item.color || `var(--mantine-color-blue-${6 + index})`,
    tooltip: `${item.label}: ${item.value}`,
  }));

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
        <Group  mb="md">
          <RingProgress
            size={200}
            thickness={20}
            sections={chartData}
            label={
              <Text
                size="xs"
                ta="center"
                px="xs"
                style={{ pointerEvents: "none" }}
              >
                Total: {total}
              </Text>
            }
          />
        </Group>
      )}

      <Group >
        {data.map((item, index) => (
          <Group key={item.label}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                backgroundColor:
                  item.color || `var(--mantine-color-blue-${6 + index})`,
              }}
            />
            <Text size="sm">
              {item.label}: {item.value}
            </Text>
          </Group>
        ))}
      </Group>
    </Card>
  );
}
