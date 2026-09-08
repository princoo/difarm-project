import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import type { DatesSetArg, EventClickArg, EventInput } from "@fullcalendar/core";
import { Dialog, Transition } from "@headlessui/react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisHorizontalIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { useSafeT } from "@/hooks/useSafeT";
import { fetchFarmTeamUsers, useFarmTasks } from "@/hooks/api/activities";
import { usePlantings } from "@/hooks/api/agriculture";
import { requireSelectedFarmId } from "@/utils/farmId";
import { Link, useNavigate } from "@/lib/router-compat";

type CalendarView = "month" | "week" | "day" | "list" | "year";

const VIEW_MAP: Record<CalendarView, string> = {
  month: "dayGridMonth",
  week: "timeGridWeek",
  day: "timeGridDay",
  list: "listWeek",
  year: "dayGridYear",
};

function formatRange(start: Date, end: Date, viewType: string) {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const yearOpts: Intl.DateTimeFormatOptions = { ...opts, year: "numeric" };
  if (viewType.includes("dayGrid") && viewType !== "dayGridYear") {
    return start.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }
  if (viewType === "dayGridYear") {
    return String(start.getFullYear());
  }
  const endAdj = new Date(end);
  endAdj.setDate(endAdj.getDate() - 1);
  if (start.getMonth() === endAdj.getMonth()) {
    return `${start.toLocaleDateString(undefined, opts)} – ${endAdj.toLocaleDateString(undefined, yearOpts)}`;
  }
  return `${start.toLocaleDateString(undefined, opts)} – ${endAdj.toLocaleDateString(undefined, yearOpts)}`;
}

function toLocalDateInput(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function ScheduleCalendar() {
  const { t } = useSafeT();
  const navigate = useNavigate();
  const calRef = useRef<FullCalendar>(null);
  const { items: tasks, fetchAll: fetchTasks, create } = useFarmTasks();
  const { items: plantings, fetchAll: fetchPlantings } = usePlantings();

  const [activeView, setActiveView] = useState<CalendarView>("week");
  const [rangeTitle, setRangeTitle] = useState("");
  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [eventOpen, setEventOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [eventForm, setEventForm] = useState({ title: "", date: toLocalDateInput(new Date()), allDay: true });
  const [taskForm, setTaskForm] = useState({ title: "", dueDate: toLocalDateInput(new Date()), assigneeUserId: "" });

  useEffect(() => {
    fetchTasks();
    fetchPlantings();
    const farmId = requireSelectedFarmId();
    if (farmId) fetchFarmTeamUsers(farmId).then(setUsers).catch(() => setUsers([]));
  }, [fetchTasks, fetchPlantings]);

  const api = useCallback(() => calRef.current?.getApi(), []);

  const events = useMemo(() => {
    const q = search.trim().toLowerCase();
    const taskEvents: EventInput[] = tasks
      .filter((task) => {
        if (userFilter && task.assigneeUserId !== userFilter) return false;
        if (q && !task.title.toLowerCase().includes(q)) return false;
        return task.dueDate || task.scheduledDate;
      })
      .map((task) => {
        const dateStr = (task.scheduledDate || task.dueDate) as string;
        const isAllDay = !task.scheduledDate || dateStr.length <= 10;
        return {
          id: `task-${task.id}`,
          title: task.title,
          start: dateStr,
          allDay: isAllDay,
          backgroundColor: task.color || "#228B22",
          borderColor: task.color || "#228B22",
          extendedProps: { type: "task", taskId: task.id },
        };
      });

    const plantingEvents: EventInput[] = plantings.flatMap((p) => {
      if (q && !(p.cropType?.name ?? "").toLowerCase().includes(q)) return [];
      const list: EventInput[] = [];
      if (p.plantedDate) {
        list.push({
          id: `plant-${p.id}`,
          title: `${p.cropType?.name ?? "Crop"} ${t("farmbrite.planted")}`,
          start: p.plantedDate,
          allDay: true,
          backgroundColor: "#00ab55",
          borderColor: "#00ab55",
          extendedProps: { type: "planting" },
        });
      }
      if (p.expectedHarvestDate) {
        list.push({
          id: `harvest-${p.id}`,
          title: `${p.cropType?.name ?? "Crop"} ${t("farmbrite.harvest")}`,
          start: p.expectedHarvestDate,
          allDay: true,
          backgroundColor: "#e2a03f",
          borderColor: "#e2a03f",
          extendedProps: { type: "planting" },
        });
      }
      return list;
    });

    return [...taskEvents, ...plantingEvents];
  }, [tasks, plantings, search, userFilter, t]);

  const onDatesSet = (arg: DatesSetArg) => {
    setRangeTitle(formatRange(arg.start, arg.end, arg.view.type));
    const reverse: Record<string, CalendarView> = {
      dayGridMonth: "month",
      timeGridWeek: "week",
      timeGridDay: "day",
      listWeek: "list",
      dayGridYear: "year",
    };
    const v = reverse[arg.view.type];
    if (v) setActiveView(v);
  };

  const changeView = (view: CalendarView) => {
    api()?.changeView(VIEW_MAP[view]);
    setActiveView(view);
  };

  const goToday = () => api()?.today();
  const goPrev = () => api()?.prev();
  const goNext = () => api()?.next();

  const onEventClick = (info: EventClickArg) => {
    if (info.event.extendedProps.type === "task") {
      navigate("/account/activities");
    }
  };

  const saveEvent = async () => {
    if (!eventForm.title.trim()) return;
    try {
      await create({
        title: eventForm.title.trim(),
        scheduledDate: eventForm.date,
        dueDate: eventForm.date,
        status: "TODO",
        category: "OTHER",
      });
      setEventOpen(false);
      setEventForm({ title: "", date: toLocalDateInput(new Date()), allDay: true });
    } catch {
      /* toast handled by api layer */
    }
  };

  const saveTask = async () => {
    if (!taskForm.title.trim()) return;
    try {
      await create({
        title: taskForm.title.trim(),
        dueDate: taskForm.dueDate,
        assigneeUserId: taskForm.assigneeUserId || null,
        status: "TODO",
        priority: "MEDIUM",
      });
      setTaskOpen(false);
      setTaskForm({ title: "", dueDate: toLocalDateInput(new Date()), assigneeUserId: "" });
    } catch {
      /* toast handled by api layer */
    }
  };

  const viewButtons: { id: CalendarView; labelKey: string }[] = [
    { id: "month", labelKey: "farmbrite.viewMonth" },
    { id: "week", labelKey: "farmbrite.viewWeek" },
    { id: "day", labelKey: "farmbrite.viewDay" },
    { id: "list", labelKey: "farmbrite.viewList" },
    { id: "year", labelKey: "farmbrite.viewYear" },
  ];

  return (
    <div className="panel space-y-4">
      <div>
        <h1 className="text-xl font-semibold">{t("nav.schedule")}</h1>
        <p className="text-sm text-gray-500">{t("farmbrite.scheduleSubtitle")}</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn btn-primary" onClick={() => setEventOpen(true)}>
            {t("farmbrite.addEvent")}
          </button>
          <button type="button" className="btn btn-outline-dark" onClick={() => setTaskOpen(true)}>
            {t("farmbrite.addTask")}
          </button>
          <div className="relative">
            <button
              type="button"
              className="btn btn-outline-dark px-3"
              onClick={() => setOptionsOpen((o) => !o)}
              aria-label={t("farmbrite.options")}
            >
              <EllipsisHorizontalIcon className="w-5 h-5" />
            </button>
            {optionsOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setOptionsOpen(false)} aria-hidden />
                <div className="absolute left-0 top-full z-20 mt-1 w-44 panel py-1 shadow-lg">
                  <Link to="/account/schedule/timesheets" className="block px-4 py-2 text-sm hover:text-primary">
                    {t("nav.timesheets")}
                  </Link>
                  <Link to="/account/activities" className="block px-4 py-2 text-sm hover:text-primary">
                    {t("farmbrite.viewAllTasks")}
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              className="form-input ltr:pl-9 rtl:pr-9 w-48 sm:w-56"
              placeholder={t("common.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="form-select w-auto min-w-[120px]" value={userFilter} onChange={(e) => setUserFilter(e.target.value)}>
            <option value="">{t("farmbrite.allUsers")}</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {[u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || u.username}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Calendar toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-white-light dark:border-[#1b2e4b] bg-white dark:bg-[#0e1726] px-3 py-2">
        <div className="flex items-center gap-1">
          <button type="button" className="p-2 rounded hover:text-primary" onClick={goPrev} aria-label="Previous">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <button type="button" className="p-2 rounded hover:text-primary" onClick={goNext} aria-label="Next">
            <ChevronRightIcon className="w-5 h-5" />
          </button>
          <button type="button" className="btn btn-sm btn-outline-primary ltr:ml-1 rtl:mr-1" onClick={goToday}>
            {t("farmbrite.today")}
          </button>
        </div>
        <p className="text-base font-semibold text-black dark:text-white min-w-[180px] text-center">{rangeTitle}</p>
        <div className="inline-flex rounded-md overflow-hidden">
          {viewButtons.map(({ id, labelKey }) => (
            <button
              key={id}
              type="button"
              className={`px-3 py-1.5 text-sm border ltr:border-l-0 first:ltr:border-l rtl:border-r-0 first:rtl:border-r border-white-light dark:border-[#1b2e4b] transition-colors ${
                activeView === id
                  ? "bg-primary text-white font-medium"
                  : "bg-white dark:bg-[#0e1726] text-[#506690] hover:text-primary dark:text-white-dark"
              }`}
              onClick={() => changeView(id)}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar grid */}
      <div className="schedule-calendar-difarm calendar-wrapper">
        <FullCalendar
          ref={calRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="timeGridWeek"
          headerToolbar={false}
          events={events}
          eventClick={onEventClick}
          datesSet={onDatesSet}
          firstDay={0}
          weekNumbers
          weekNumberFormat={{ week: "numeric" }}
          slotMinTime="06:00:00"
          slotMaxTime="24:00:00"
          slotDuration="01:00:00"
          slotLabelInterval="01:00:00"
          slotLabelFormat={{ hour: "numeric", meridiem: "short" }}
          allDaySlot
          nowIndicator
          height={640}
          dayHeaderFormat={{ weekday: "short", month: "numeric", day: "numeric" }}
          views={{
            dayGridYear: {
              type: "dayGrid",
              duration: { months: 12 },
            },
            timeGridWeek: {
              dayHeaderFormat: { weekday: "short", month: "numeric", day: "numeric" },
            },
          }}
          locale={undefined}
        />
      </div>

      {/* Add Event modal */}
      <Transition show={eventOpen} as={Fragment}>
        <Dialog onClose={() => setEventOpen(false)} className="relative z-50">
          <div className="fixed inset-0 bg-black/40" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="panel w-full max-w-md space-y-3">
              <Dialog.Title className="text-lg font-semibold">{t("farmbrite.addEvent")}</Dialog.Title>
              <input
                className="form-input"
                placeholder={t("activities.taskTitle")}
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
              />
              <input
                type="date"
                className="form-input"
                value={eventForm.date}
                onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
              />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={eventForm.allDay} onChange={(e) => setEventForm({ ...eventForm, allDay: e.target.checked })} />
                {t("farmbrite.allDay")}
              </label>
              <div className="flex justify-end gap-2">
                <button type="button" className="btn btn-outline-dark" onClick={() => setEventOpen(false)}>{t("common.cancel")}</button>
                <button type="button" className="btn btn-primary" onClick={saveEvent}>{t("common.save")}</button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>

      {/* Add Task modal */}
      <Transition show={taskOpen} as={Fragment}>
        <Dialog onClose={() => setTaskOpen(false)} className="relative z-50">
          <div className="fixed inset-0 bg-black/40" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="panel w-full max-w-md space-y-3">
              <Dialog.Title className="text-lg font-semibold">{t("farmbrite.addTask")}</Dialog.Title>
              <input
                className="form-input"
                placeholder={t("activities.taskTitle")}
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              />
              <input
                type="date"
                className="form-input"
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
              />
              <select className="form-select" value={taskForm.assigneeUserId} onChange={(e) => setTaskForm({ ...taskForm, assigneeUserId: e.target.value })}>
                <option value="">{t("activities.unassigned")}</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {[u.firstName, u.lastName].filter(Boolean).join(" ") || u.email}
                  </option>
                ))}
              </select>
              <div className="flex justify-end gap-2">
                <button type="button" className="btn btn-outline-dark" onClick={() => setTaskOpen(false)}>{t("common.cancel")}</button>
                <button type="button" className="btn btn-primary" onClick={saveTask}>{t("common.save")}</button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
