import ScheduleCalendar from "./ScheduleCalendar";
import FarmRequiredNotice from "@/components/Admin/FarmRequiredNotice";

export default function SchedulePage() {
  return (
    <FarmRequiredNotice>
      <ScheduleCalendar />
    </FarmRequiredNotice>
  );
}
