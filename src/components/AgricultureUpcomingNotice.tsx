import { Link } from "@/lib/router-compat";
import { useSafeT } from "@/hooks/useSafeT";
import { SparklesIcon } from "@heroicons/react/24/outline";

type Props = {
  /** Where "Back" should go. Defaults to livestock dashboard. */
  backTo?: string;
};

export default function AgricultureUpcomingNotice({ backTo = "/account" }: Props) {
  const { t } = useSafeT();

  return (
    <div className="panel max-w-xl mx-auto text-center py-12 px-6 space-y-4">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <SparklesIcon className="h-7 w-7" />
      </div>
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
        {t("dashboard.agricultureUpcomingTitle")}
      </h1>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {t("dashboard.agricultureUpcomingBody")}
      </p>
      <Link to={backTo} className="btn btn-primary inline-flex">
        {t("dashboard.agricultureUpcomingCta")}
      </Link>
    </div>
  );
}
