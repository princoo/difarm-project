import RecentOrdersWidget from "../widgets/RecentOrdersWidget";
import FarmbriteModuleShell from "../FarmbriteModuleShell";

export default function MarketDashboardPage() {
  return (
    <FarmbriteModuleShell titleKey="nav.marketDashboard" subtitleKey="farmbrite.marketSubtitle">
      <RecentOrdersWidget />
    </FarmbriteModuleShell>
  );
}
