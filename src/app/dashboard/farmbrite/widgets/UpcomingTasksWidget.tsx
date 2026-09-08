import { useEffect } from "react";
import { Link } from "@/lib/router-compat";
import { useSafeT } from "@/hooks/useSafeT";
import { useFarmTasks } from "@/hooks/api/activities";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

function assigneeName(task: any) {
  if (!task.assignee) return null;
  const n = [task.assignee.firstName, task.assignee.lastName].filter(Boolean).join(" ");
  return n || task.assignee.email;
}

export default function UpcomingTasksWidget() {
  const { t } = useSafeT();
  const { items, loading, fetchAll } = useFarmTasks();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const upcoming = items
    .filter((task) => task.status === "TODO" || task.status === "IN_PROGRESS")
    .sort((a, b) => {
      const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return da - db;
    })
    .slice(0, 5);

  return (
    <div className="panel h-full flex flex-col">
      <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase mb-4">
        {t("farmbrite.topUpcomingTasks")}
      </p>
      {loading ? (
        <p className="text-sm text-gray-500 flex-1">{t("common.loading")}</p>
      ) : upcoming.length === 0 ? (
        <p className="text-gray-400 text-center flex-1 flex items-center justify-center py-8">
          {t("farmbrite.noTasksDue")}
        </p>
      ) : (
        <ul className="space-y-3 flex-1">
          {upcoming.map((task) => (
            <li key={task.id} className="flex items-start gap-2 text-sm border-l-4 pl-2" style={{ borderColor: task.color || "#3b82f6" }}>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{task.title}</p>
                <p className="text-xs text-gray-500">
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : t("farmbrite.noDueDate")}
                  {assigneeName(task) ? ` · ${assigneeName(task)}` : ""}
                </p>
              </div>
              <span className="badge bg-secondary text-xs shrink-0">{task.priority}</span>
            </li>
          ))}
        </ul>
      )}
      <Link to="/account/activities" className="inline-flex items-center gap-1 text-sm text-primary mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
        {t("farmbrite.viewAllTasks")} <ChevronRightIcon className="w-4 h-4" />
      </Link>
    </div>
  );
}
