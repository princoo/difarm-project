import { useSelectedFarm } from "@/hooks/useSelectedFarm";
import { useGetFarmById } from "@/hooks/api/farms";
import { getFarmId } from "@/utils/farmId";
import FarmbriteModuleShell from "../FarmbriteModuleShell";
import { useSafeT } from "@/hooks/useSafeT";

export default function FarmMapPage() {
  const { t } = useSafeT();
  const { farm } = useSelectedFarm();
  const farmId = getFarmId() ?? "";
  const { farm: detail }: any = useGetFarmById(farmId);
  const d = detail?.data ?? farm;
  const lat = d?.latitude ? Number(d.latitude) : -1.9441;
  const lon = d?.longitude ? Number(d.longitude) : 30.0619;
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.05}%2C${lat - 0.05}%2C${lon + 0.05}%2C${lat + 0.05}&layer=mapnik&marker=${lat}%2C${lon}`;

  return (
    <FarmbriteModuleShell titleKey="nav.farmMap" subtitleKey="farmbrite.farmMapSubtitle">
      <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <iframe title={t("nav.farmMap")} src={mapSrc} className="w-full h-[420px] border-0" loading="lazy" />
      </div>
      {d?.location && (
        <p className="text-sm text-gray-500 mt-3">{d.location}</p>
      )}
    </FarmbriteModuleShell>
  );
}
