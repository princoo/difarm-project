import WeatherWidget from "../widgets/WeatherWidget";
import FarmbriteModuleShell from "../FarmbriteModuleShell";

export default function ClimatePage() {
  return (
    <FarmbriteModuleShell titleKey="nav.climate" subtitleKey="farmbrite.climateSubtitle">
      <WeatherWidget />
    </FarmbriteModuleShell>
  );
}
