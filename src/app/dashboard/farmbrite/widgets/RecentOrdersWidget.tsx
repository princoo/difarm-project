import { Link } from "@/lib/router-compat";
import { useSafeT } from "@/hooks/useSafeT";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

export default function RecentOrdersWidget() {
  const { t } = useSafeT();

  return (
    <div className="panel h-full flex flex-col">
      <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase mb-4">
        {t("farmbrite.recentOrders")}
      </p>
      <div className="flex-1 flex items-center justify-center min-h-[160px] bg-white-light/30 dark:bg-black/20 rounded-lg border border-dashed border-white-light dark:border-[#1b2e4b]">
        <p className="text-gray-400 text-sm">{t("farmbrite.notEnoughDataToChart")}</p>
      </div>
      <Link to="/account/market" className="inline-flex items-center gap-1 text-sm text-primary mt-4">
        {t("farmbrite.viewOrders")} <ChevronRightIcon className="w-4 h-4" />
      </Link>
    </div>
  );
}
