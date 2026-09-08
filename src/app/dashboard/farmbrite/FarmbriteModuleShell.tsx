import { ReactNode } from "react";
import { useSafeT } from "@/hooks/useSafeT";

type Props = {
  titleKey: string;
  subtitleKey: string;
  children?: ReactNode;
};

export default function FarmbriteModuleShell({ titleKey, subtitleKey, children }: Props) {
  const { t } = useSafeT();
  return (
    <div className="panel">
      <div className="mb-5">
        <h1 className="text-xl font-semibold">{t(titleKey)}</h1>
        <p className="text-sm text-gray-500">{t(subtitleKey)}</p>
      </div>
      {children ?? (
        <div className="rounded-lg border border-dashed border-white-light dark:border-[#1b2e4b] p-10 text-center text-gray-400">
          {t("farmbrite.moduleComingSoon")}
        </div>
      )}
    </div>
  );
}
