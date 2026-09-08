import { useEffect } from "react";
import { useGrowFields } from "@/hooks/api/agriculture";
import { useSafeT } from "@/hooks/useSafeT";
import FarmbriteModuleShell from "../../FarmbriteModuleShell";
import { Link } from "@/lib/router-compat";

export default function LocationMapPage() {
  const { t } = useSafeT();
  const { items, fetchAll, loading } = useGrowFields();

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <FarmbriteModuleShell titleKey="nav.locationMap" subtitleKey="farmbrite.locationMapSubtitle">
      {loading ? (
        <p className="text-sm text-gray-500">{t("common.loading")}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500">{t("agriculture.noFields")}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((field) => (
            <Link
              key={field.id}
              to="/account/farm-map"
              className="panel border hover:shadow-md transition p-4"
            >
              <p className="font-semibold">{field.name}</p>
              <p className="text-sm text-gray-500">{field.locationNotes || field.size ? `${field.size ?? ""} ${field.unit ?? ""}` : t("farmbrite.viewOnMap")}</p>
            </Link>
          ))}
        </div>
      )}
    </FarmbriteModuleShell>
  );
}
