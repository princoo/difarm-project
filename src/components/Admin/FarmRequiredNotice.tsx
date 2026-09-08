import { ReactNode } from "react";
import { useSafeT } from "@/hooks/useSafeT";
import { useSelectedFarmId } from "@/hooks/useSelectedFarmId";
import HeaderFarmSelector from "./HeaderFarmSelector";

type Props = {
  children: ReactNode;
  /** When true, always render children (e.g. dashboard overview with optional farm). */
  optional?: boolean;
};

export default function FarmRequiredNotice({ children, optional = false }: Props) {
  const { t } = useSafeT();
  const farmId = useSelectedFarmId();

  if (farmId || optional) {
    return <>{children}</>;
  }

  return (
    <div className="panel max-w-lg mx-auto text-center py-10 space-y-4">
      <p className="text-gray-600 dark:text-gray-400">{t("dashboard.selectFarmForModule")}</p>
      <div className="flex justify-center">
        <HeaderFarmSelector className="min-w-[240px]" />
      </div>
    </div>
  );
}
