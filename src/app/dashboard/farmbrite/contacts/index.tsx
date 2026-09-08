import { useEffect } from "react";
import FarmbriteModuleShell from "../FarmbriteModuleShell";
import { useSafeT } from "@/hooks/useSafeT";
import { useSuppliers } from "@/hooks/api/suppliers";
import { fetchFarmTeamUsers } from "@/hooks/api/activities";
import { requireSelectedFarmId } from "@/utils/farmId";
import { useState } from "react";

export default function ContactsPage() {
  const { t } = useSafeT();
  const { suppliers, getSuppliers } = useSuppliers();
  const [team, setTeam] = useState<any[]>([]);

  useEffect(() => {
    getSuppliers();
    const farmId = requireSelectedFarmId();
    if (farmId) fetchFarmTeamUsers(farmId).then(setTeam).catch(() => setTeam([]));
  }, [getSuppliers]);

  const supplierList: any[] = Array.isArray(suppliers)
    ? suppliers
    : suppliers?.data?.data ?? suppliers?.data ?? [];

  return (
    <FarmbriteModuleShell titleKey="nav.contacts" subtitleKey="farmbrite.contactsSubtitle">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="font-semibold mb-3">{t("farmbrite.farmTeam")}</h2>
          {team.length === 0 ? (
            <p className="text-sm text-gray-500">{t("farmbrite.noContacts")}</p>
          ) : (
            <ul className="space-y-2">
              {team.map((u) => (
                <li key={u.id} className="text-sm panel border py-2 px-3">
                  {[u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || u.username}
                  {u.email && <span className="text-gray-500 block text-xs">{u.email}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h2 className="font-semibold mb-3">{t("farmbrite.suppliers")}</h2>
          {supplierList.length === 0 ? (
            <p className="text-sm text-gray-500">{t("farmbrite.noSuppliers")}</p>
          ) : (
            <ul className="space-y-2">
              {supplierList.map((s: any) => (
                <li key={s.id} className="text-sm panel border py-2 px-3">
                  {s.name}
                  {s.phone && <span className="text-gray-500 block text-xs">{s.phone}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </FarmbriteModuleShell>
  );
}
