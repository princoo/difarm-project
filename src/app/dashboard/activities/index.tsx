import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import IconPlus from "@/components/Icon/IconPlus";
import { useSafeT } from "@/hooks/useSafeT";
import { canCreateEntity, canDeleteEntity, canUpdateEntity } from "@/utils/permissions";
import { isLoggedIn } from "@/hooks/api/auth";
import { useEffectiveFarmCategory } from "@/hooks/useEffectiveFarmCategory";
import { requireSelectedFarmId } from "@/utils/farmId";
import {
  FarmTask,
  fetchFarmTeamUsers,
  useFarmTasks,
} from "@/hooks/api/activities";
import { useGrowFields, usePlantings } from "@/hooks/api/agriculture";
import FarmRequiredNotice from "@/components/Admin/FarmRequiredNotice";
import { useCattle } from "@/hooks/api/cattle";
import { useLivestock } from "@/hooks/api/livestock";
import {
  CalendarDaysIcon,
  ListBulletIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";

const STATUSES = ["TODO", "IN_PROGRESS", "DONE", "MISSED", "SKIPPED"] as const;
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
const CATEGORIES = ["LIVESTOCK", "CROPS", "MAINTENANCE", "ADMIN", "OTHER"] as const;
const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#64748b"];
const BOARD_COLUMNS = ["TODO", "IN_PROGRESS", "DONE"] as const;

type ViewMode = "list" | "board" | "calendar";

const emptyForm = () => ({
  title: "",
  description: "",
  status: "TODO",
  priority: "MEDIUM",
  category: "OTHER",
  color: "#3b82f6",
  dueDate: "",
  scheduledDate: "",
  hoursSpent: "",
  assigneeUserId: "",
  fieldId: "",
  plantingId: "",
  cattleId: "",
  livestockId: "",
  checklist: [] as { label: string; done: boolean }[],
});

function assigneeName(task: FarmTask) {
  if (!task.assignee) return "—";
  const n = [task.assignee.firstName, task.assignee.lastName].filter(Boolean).join(" ");
  return n || task.assignee.email || "—";
}

function priorityClass(priority: string) {
  switch (priority) {
    case "URGENT": return "bg-danger";
    case "HIGH": return "bg-warning";
    case "LOW": return "bg-secondary";
    default: return "bg-primary";
  }
}

function statusClass(status: string) {
  switch (status) {
    case "DONE": return "bg-success";
    case "IN_PROGRESS": return "bg-info";
    case "MISSED": return "bg-danger";
    case "SKIPPED": return "bg-dark";
    default: return "bg-secondary";
  }
}

export default function ActivitiesPage() {
  const { t } = useSafeT();
  const role = isLoggedIn()?.role ?? "";
  const { isAgriculture } = useEffectiveFarmCategory();
  const { items, stats, loading, fetchAll, fetchStats, create, update, remove } = useFarmTasks();
  const { items: fields, fetchAll: fetchFields } = useGrowFields();
  const { items: plantings, fetchAll: fetchPlantings } = usePlantings();
  const { allCattles, fetchAllCattle } = useCattle();
  const { allLivestock, fetchAllLivestock } = useLivestock();

  const [view, setView] = useState<ViewMode>("list");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FarmTask | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [users, setUsers] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [search, setSearch] = useState("");
  const [newChecklistItem, setNewChecklistItem] = useState("");

  const loadRefs = useCallback(async () => {
    const farmId = requireSelectedFarmId();
    if (!farmId) return;
    try {
      const team = await fetchFarmTeamUsers(farmId);
      setUsers(team);
    } catch {
      setUsers([]);
    }
    if (isAgriculture) {
      fetchFields();
      fetchPlantings();
    } else {
      await fetchAllCattle();
      await fetchAllLivestock();
    }
  }, [fetchAllCattle, fetchAllLivestock, fetchFields, fetchPlantings, isAgriculture]);

  const cattleList = (allCattles as any)?.data?.data ?? [];
  const livestockList = (allLivestock as any)?.data?.data ?? [];

  useEffect(() => {
    fetchAll(filterStatus || filterCategory ? { ...(filterStatus && { status: filterStatus }), ...(filterCategory && { category: filterCategory }) } : undefined);
    fetchStats();
    loadRefs();
  }, [fetchAll, fetchStats, filterStatus, filterCategory, loadRefs]);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q) ||
        assigneeName(t).toLowerCase().includes(q)
    );
  }, [items, search]);

  const calendarEvents = useMemo(
    () =>
      filtered
        .filter((task) => task.dueDate || task.scheduledDate)
        .map((task) => ({
          id: task.id,
          title: task.title,
          start: (task.scheduledDate || task.dueDate) as string,
          end: task.dueDate || undefined,
          backgroundColor: task.color || "#3b82f6",
          borderColor: task.color || "#3b82f6",
          extendedProps: { task },
        })),
    [filtered]
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = (task: FarmTask) => {
    setEditing(task);
    setForm({
      title: task.title,
      description: task.description ?? "",
      status: task.status,
      priority: task.priority,
      category: task.category,
      color: task.color || "#3b82f6",
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
      scheduledDate: task.scheduledDate ? task.scheduledDate.slice(0, 10) : "",
      hoursSpent: task.hoursSpent != null ? String(task.hoursSpent) : "",
      assigneeUserId: task.assigneeUserId ?? "",
      fieldId: task.fieldId ?? "",
      plantingId: task.plantingId ?? "",
      cattleId: task.cattleId ?? "",
      livestockId: task.livestockId ?? "",
      checklist: (task.checklist ?? []).map((c) => ({ label: c.label, done: c.done })),
    });
    setOpen(true);
  };

  const onSave = async () => {
    const payload = {
      ...form,
      assigneeUserId: form.assigneeUserId || null,
      fieldId: form.fieldId || null,
      plantingId: form.plantingId || null,
      cattleId: form.cattleId || null,
      livestockId: form.livestockId || null,
      hoursSpent: form.hoursSpent ? Number(form.hoursSpent) : null,
      dueDate: form.dueDate || null,
      scheduledDate: form.scheduledDate || null,
    };
    if (editing) {
      await update(editing.id, payload);
    } else {
      await create(payload);
    }
    setOpen(false);
  };

  const onQuickStatus = async (task: FarmTask, status: string) => {
    if (!canUpdateEntity("activities", role)) return;
    await update(task.id, { status });
  };

  const addChecklistRow = () => {
    if (!newChecklistItem.trim()) return;
    setForm((f) => ({
      ...f,
      checklist: [...f.checklist, { label: newChecklistItem.trim(), done: false }],
    }));
    setNewChecklistItem("");
  };

  const TaskCard = ({ task }: { task: FarmTask }) => (
    <div
      className="rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900 p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
      style={{ borderLeftWidth: 4, borderLeftColor: task.color || "#3b82f6" }}
      onClick={() => openEdit(task)}
      onKeyDown={(e) => e.key === "Enter" && openEdit(task)}
      role="button"
      tabIndex={0}
    >
      <div className="font-medium text-sm mb-1">{task.title}</div>
      {task.dueDate && (
        <div className="text-xs text-gray-500 mb-2">
          {t("activities.due")}: {new Date(task.dueDate).toLocaleDateString()}
        </div>
      )}
      <div className="flex flex-wrap gap-1 mb-2">
        <span className={`badge ${priorityClass(task.priority)} text-xs`}>{task.priority}</span>
        <span className={`badge ${statusClass(task.status)} text-xs`}>{task.status.replace("_", " ")}</span>
      </div>
      <div className="text-xs text-gray-500">{assigneeName(task)}</div>
      {canUpdateEntity("activities", role) && view === "board" && (
        <select
          className="form-select form-select-sm mt-2"
          value={task.status}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            e.stopPropagation();
            onQuickStatus(task, e.target.value);
          }}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace("_", " ")}</option>
          ))}
        </select>
      )}
    </div>
  );

  return (
    <FarmRequiredNotice>
    <div className="space-y-5">
      <div className="panel">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl font-semibold">{t("activities.title")}</h1>
            <p className="text-sm text-gray-500">{t("activities.subtitle")}</p>
          </div>
          {canCreateEntity("activities", role) && (
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              <IconPlus className="w-4 h-4 ltr:mr-1 rtl:ml-1" /> {t("activities.newActivity")}
            </button>
          )}
        </div>

        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
            {[
              { label: t("activities.statsTodo"), value: stats.todo, cls: "text-secondary" },
              { label: t("activities.statsInProgress"), value: stats.inProgress, cls: "text-info" },
              { label: t("activities.statsDone"), value: stats.done, cls: "text-success" },
              { label: t("activities.statsOverdue"), value: stats.overdue, cls: "text-danger" },
              { label: t("activities.statsDueWeek"), value: stats.dueThisWeek, cls: "text-warning" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border dark:border-gray-700 p-3 text-center">
                <div className={`text-2xl font-bold ${s.cls}`}>{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex rounded-lg overflow-hidden border dark:border-gray-700">
            {([
              { id: "list" as const, icon: ListBulletIcon, label: t("activities.viewList") },
              { id: "board" as const, icon: Squares2X2Icon, label: t("activities.viewBoard") },
              { id: "calendar" as const, icon: CalendarDaysIcon, label: t("activities.viewCalendar") },
            ]).map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                className={`flex items-center gap-1.5 px-4 py-2 text-sm ${view === id ? "bg-primary text-white" : "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
                onClick={() => setView(id)}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              className="form-input w-auto"
              placeholder={t("common.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select className="form-select w-auto" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">{t("activities.allStatuses")}</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
            </select>
            <select className="form-select w-auto" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="">{t("activities.allCategories")}</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <p>{t("common.loading")}</p>
        ) : view === "list" ? (
          <div className="table-responsive">
            <table className="table-hover">
              <thead>
                <tr>
                  <th>{t("activities.taskTitle")}</th>
                  <th>{t("activities.due")}</th>
                  <th>{t("activities.assignee")}</th>
                  <th>{t("activities.priority")}</th>
                  <th>{t("activities.status")}</th>
                  <th>{t("activities.category")}</th>
                  <th>{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((task) => (
                  <tr key={task.id}>
                    <td>
                      <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: task.color || "#3b82f6" }} />
                      {task.title}
                    </td>
                    <td>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}</td>
                    <td>{assigneeName(task)}</td>
                    <td><span className={`badge ${priorityClass(task.priority)}`}>{task.priority}</span></td>
                    <td><span className={`badge ${statusClass(task.status)}`}>{task.status.replace("_", " ")}</span></td>
                    <td>{task.category}</td>
                    <td className="flex gap-1">
                      <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => openEdit(task)}>{t("common.edit")}</button>
                      {canDeleteEntity("activities", role) && (
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => remove(task.id)}>{t("common.delete")}</button>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-gray-500 py-6">{t("activities.noActivities")}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        ) : view === "board" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {BOARD_COLUMNS.map((col) => (
              <div key={col} className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3 min-h-[320px]">
                <h3 className="font-semibold text-sm mb-3 uppercase tracking-wide text-gray-600 dark:text-gray-400">
                  {col.replace("_", " ")} ({filtered.filter((t) => t.status === col).length})
                </h3>
                <div className="space-y-2">
                  {filtered.filter((t) => t.status === col).map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            ))}
            {(filtered.some((t) => t.status === "MISSED" || t.status === "SKIPPED")) && (
              <div className="md:col-span-3 rounded-lg border border-dashed dark:border-gray-700 p-3">
                <h3 className="font-semibold text-sm mb-3">{t("activities.otherStatuses")}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {filtered.filter((t) => t.status === "MISSED" || t.status === "SKIPPED").map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="calendar-wrapper">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek" }}
              events={calendarEvents}
              eventClick={(info) => {
                const task = info.event.extendedProps.task as FarmTask;
                if (task) openEdit(task);
              }}
              height="auto"
            />
          </div>
        )}
      </div>

      <Transition show={open} as={Fragment}>
        <Dialog onClose={() => setOpen(false)} className="relative z-50">
          <div className="fixed inset-0 bg-black/40" />
          <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
            <Dialog.Panel className="panel w-full max-w-lg space-y-3 my-8">
              <Dialog.Title className="text-lg font-semibold">
                {editing ? t("activities.editActivity") : t("activities.newActivity")}
              </Dialog.Title>

              <input
                className="form-input"
                placeholder={t("activities.taskTitle")}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <textarea
                className="form-textarea"
                rows={3}
                placeholder={t("activities.description")}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-2">
                <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                </select>
                <select className="form-select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <select className="form-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className="form-select" value={form.assigneeUserId} onChange={(e) => setForm({ ...form, assigneeUserId: e.target.value })}>
                  <option value="">{t("activities.unassigned")}</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {[u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || u.username}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">{t("activities.due")}</label>
                  <input type="date" className="form-input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-500">{t("activities.scheduled")}</label>
                  <input type="date" className="form-input" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500">{t("activities.hoursSpent")}</label>
                <input type="number" step="0.25" min="0" className="form-input" value={form.hoursSpent} onChange={(e) => setForm({ ...form, hoursSpent: e.target.value })} />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t("activities.color")}</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`w-7 h-7 rounded-full border-2 ${form.color === c ? "border-gray-900 dark:border-white scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setForm({ ...form, color: c })}
                    />
                  ))}
                </div>
              </div>

              {isAgriculture ? (
                <div className="grid grid-cols-2 gap-2">
                  <select className="form-select" value={form.fieldId} onChange={(e) => setForm({ ...form, fieldId: e.target.value })}>
                    <option value="">{t("activities.linkField")}</option>
                    {fields.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                  <select className="form-select" value={form.plantingId} onChange={(e) => setForm({ ...form, plantingId: e.target.value })}>
                    <option value="">{t("activities.linkPlanting")}</option>
                    {plantings.map((p) => (
                      <option key={p.id} value={p.id}>{p.cropType?.name} — {p.field?.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <select className="form-select" value={form.cattleId} onChange={(e) => setForm({ ...form, cattleId: e.target.value })}>
                    <option value="">{t("activities.linkCattle")}</option>
                    {cattleList.map((c: any) => <option key={c.id} value={c.id}>{c.tagNumber}</option>)}
                  </select>
                  <select className="form-select" value={form.livestockId} onChange={(e) => setForm({ ...form, livestockId: e.target.value })}>
                    <option value="">{t("activities.linkLivestock")}</option>
                    {livestockList.map((l: any) => <option key={l.id} value={l.id}>{l.tagNumber} ({l.species})</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t("activities.checklist")}</label>
                {form.checklist.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-1">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={(e) => {
                        const next = [...form.checklist];
                        next[idx] = { ...next[idx], done: e.target.checked };
                        setForm({ ...form, checklist: next });
                      }}
                    />
                    <span className={`flex-1 text-sm ${item.done ? "line-through text-gray-400" : ""}`}>{item.label}</span>
                    <button
                      type="button"
                      className="text-danger text-xs"
                      onClick={() => setForm({ ...form, checklist: form.checklist.filter((_, i) => i !== idx) })}
                    >
                      {t("common.delete")}
                    </button>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <input
                    className="form-input flex-1"
                    placeholder={t("activities.checklistItem")}
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addChecklistRow())}
                  />
                  <button type="button" className="btn btn-outline-primary btn-sm" onClick={addChecklistRow}>{t("common.add")}</button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn btn-outline-dark" onClick={() => setOpen(false)}>{t("common.cancel")}</button>
                <button type="button" className="btn btn-primary" onClick={onSave} disabled={!form.title.trim()}>{t("common.save")}</button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>
    </div>
    </FarmRequiredNotice>
  );
}
