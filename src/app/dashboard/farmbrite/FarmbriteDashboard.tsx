import WeatherWidget from "./widgets/WeatherWidget";
import UpcomingTasksWidget from "./widgets/UpcomingTasksWidget";
import RecentOrdersWidget from "./widgets/RecentOrdersWidget";
import AgricultureMetricsPage from "../OverView/AgricultureMetricsPage";

export default function FarmbriteDashboard() {
  return (
    <div className="space-y-4">
      <WeatherWidget />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <UpcomingTasksWidget />
        <RecentOrdersWidget />
      </div>
      <AgricultureMetricsPage />
    </div>
  );
}
