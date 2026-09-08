import { useEffect, useState } from "react";
import { useSelectedFarm } from "@/hooks/useSelectedFarm";
import { useSafeT } from "@/hooks/useSafeT";
import { useGetFarmById } from "@/hooks/api/farms";
import { getFarmId } from "@/utils/farmId";
import { CloudIcon, SunIcon } from "@heroicons/react/24/outline";

type WeatherData = {
  locationName: string;
  current: {
    temp: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    description: string;
    high: number;
    low: number;
    sunset: string;
    skyCover: number;
    precip1h: number;
  };
  hourly: { time: string; temp: number; windSpeed: number; precipProb: number; description: string }[];
};

export default function WeatherWidget() {
  const { t } = useSafeT();
  const { farm } = useSelectedFarm();
  const farmId = getFarmId() ?? "";
  const { farm: farmDetail }: any = useGetFarmById(farmId);
  const [data, setData] = useState<WeatherData | null>(null);
  const [tab, setTab] = useState<"hourly" | "daily">("hourly");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const detail = farmDetail?.data ?? farm;
        const lat = detail?.latitude;
        const lon = detail?.longitude;
        const location = detail?.location || farm?.location || "Kigali";
        const q = new URLSearchParams();
        if (lat && lon) {
          q.set("lat", String(lat));
          q.set("lon", String(lon));
        }
        q.set("location", location);
        const res = await fetch(`/api/weather?${q.toString()}`);
        if (res.ok) setData(await res.json());
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [farm, farmDetail]);

  if (loading) {
    return (
      <div className="panel">
        <p className="text-sm text-gray-500">{t("common.loading")}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="panel">
        <p className="text-xs font-semibold tracking-wide text-primary uppercase mb-2">
          {t("farmbrite.weatherFor")} {farm?.location?.split(",")[0]?.toUpperCase() || "KIGALI"}
        </p>
        <p className="text-gray-500 text-sm">{t("farmbrite.weatherUnavailable")}</p>
      </div>
    );
  }

  return (
    <div className="panel !p-0 overflow-hidden">
      <div className="px-5 pt-4 pb-2 border-b border-white-light dark:border-[#1b2e4b]">
        <p className="text-xs font-semibold tracking-wide text-primary uppercase">
          {t("farmbrite.weatherFor")} {data.locationName}
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        <div className="lg:col-span-4 p-5 flex flex-col sm:flex-row lg:flex-col gap-4 border-b lg:border-b-0 lg:border-r border-white-light dark:border-[#1b2e4b]">
          <div className="flex items-center gap-3">
            <CloudIcon className="w-16 h-16 text-primary shrink-0" />
            <div>
              <p className="text-4xl font-light text-gray-800 dark:text-white">{data.current.temp}°C</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{data.current.description}</p>
            </div>
          </div>
          <div className="text-xs text-gray-500 space-y-0.5">
            <p>{data.current.description} — H {data.current.high}°C L {data.current.low}°C</p>
            <p>{t("farmbrite.sunset")}: {data.current.sunset}</p>
            <p>{t("farmbrite.wind")}: {data.current.windSpeed} m/s</p>
            <p>{t("farmbrite.humidity")}: {data.current.humidity}%</p>
          </div>
        </div>
        <div className="lg:col-span-3 p-5 border-b lg:border-b-0 lg:border-r border-white-light dark:border-[#1b2e4b] text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <p>{t("farmbrite.feelsLike")} {data.current.feelsLike}°C</p>
          <p>{t("farmbrite.skyCover")}: {data.current.skyCover}%</p>
          <p>{t("farmbrite.precip1h")}: {data.current.precip1h}mm</p>
        </div>
        <div className="lg:col-span-5 p-5">
          <div className="flex gap-4 border-b border-white-light dark:border-[#1b2e4b] mb-3">
            {(["hourly", "daily"] as const).map((key) => (
              <button
                key={key}
                type="button"
                className={`pb-2 text-sm capitalize ${tab === key ? "border-b-2 border-primary text-primary font-medium" : "text-gray-500"}`}
                onClick={() => setTab(key)}
              >
                {t(`farmbrite.${key}`)}
              </button>
            ))}
          </div>
          {tab === "hourly" ? (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {data.hourly.map((h) => (
                <div key={h.time} className="text-center min-w-[72px] text-xs">
                  <p className="text-gray-500 mb-1">{h.time}</p>
                  <SunIcon className="w-6 h-6 mx-auto text-warning mb-1" />
                  <p className="font-semibold text-gray-800 dark:text-white">{h.temp}°C</p>
                  <p className="text-gray-400">{h.windSpeed} m/s</p>
                  <p className="text-primary">{h.precipProb}%</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">{t("farmbrite.dailyForecastHint")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
