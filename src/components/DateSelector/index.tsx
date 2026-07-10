
import { Select } from "@mantine/core";

interface DateSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  type?: "date" | "year";
}

export function DateSelector({
  value,
  onChange,
  label,
  type = "date",
}: DateSelectorProps) {
  const currentYear = new Date().getFullYear();

  const generateOptions = () => {
    if (type === "year") {
      return Array.from({ length: 5 }, (_, i) => {
        const year = currentYear - i;
        return { value: year.toString(), label: year.toString() };
      });
    } else {
      // Generate last 30 days
      return Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        return {
          value: dateStr,
          label: date.toLocaleDateString(),
        };
      });
    }
  };

  return (
    <Select
      label={label}
      value={value}
      onChange={(val) => val && onChange(val)}
      data={generateOptions()}
      searchable
      clearable={false}
    />
  );
}
