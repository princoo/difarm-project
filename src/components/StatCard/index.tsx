import { Card, Text, Group, ThemeIcon } from "@mantine/core";
import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  loading?: boolean;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  loading,
}: StatCardProps) {
  return (
    <Card shadow="sm" radius="md" withBorder>
      <Group mb="xs">
        <Text size="sm" c="dimmed" fw={500}>
          {title}
        </Text>
        {icon && (
          <ThemeIcon variant="light" size="lg">
            {icon}
          </ThemeIcon>
        )}
      </Group>

      <Text size="xl" fw={700} mb={subtitle ? "xs" : 0}>
        {loading ? "..." : value}
      </Text>

      {subtitle && (
        <Text size="xs" c="dimmed">
          {subtitle}
        </Text>
      )}
    </Card>
  );
}
