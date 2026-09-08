import FarmbriteModuleShell from "../FarmbriteModuleShell";
import { Link } from "@/lib/router-compat";
import { useSafeT } from "@/hooks/useSafeT";

export default function ResourcesPage() {
  const { t } = useSafeT();
  return (
    <FarmbriteModuleShell titleKey="nav.resources" subtitleKey="farmbrite.resourcesSubtitle">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/account/stock" className="panel border hover:shadow-md transition">
          <h3 className="font-semibold">{t("nav.stock")}</h3>
          <p className="text-sm text-gray-500 mt-1">{t("farmbrite.resourcesStockDesc")}</p>
        </Link>
        <div className="panel border border-dashed text-gray-400 flex items-center justify-center min-h-[100px]">
          {t("farmbrite.equipmentComingSoon")}
        </div>
      </div>
    </FarmbriteModuleShell>
  );
}
