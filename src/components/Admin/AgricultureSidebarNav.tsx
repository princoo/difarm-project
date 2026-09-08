import { useEffect, useState } from "react";
import { Link, useLocation } from "@/lib/router-compat";
import { useSafeT } from "@/hooks/useSafeT";
import {
  CalculatorIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  CloudIcon,
  DocumentChartBarIcon,
  MapIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { FaCashRegister, FaTractor } from "react-icons/fa";
import { GiPlantSeed } from "react-icons/gi";
import IconHome from "../Icon/IconHome";

type NavChild = { nameKey: string; to: string };
type NavSection = {
  id: string;
  nameKey: string;
  icon: React.ComponentType<{ className?: string }>;
  to?: string;
  children?: NavChild[];
};

const SECTIONS: NavSection[] = [
  {
    id: "dashboard",
    nameKey: "nav.dashboard",
    icon: IconHome,
    to: "/account",
  },
  {
    id: "schedule",
    nameKey: "nav.schedule",
    icon: CalendarDaysIcon,
    children: [
      { nameKey: "nav.calendar", to: "/account/schedule" },
      { nameKey: "nav.timesheets", to: "/account/schedule/timesheets" },
    ],
  },
  {
    id: "tasks",
    nameKey: "nav.tasks",
    icon: CheckCircleIcon,
    to: "/account/activities",
  },
  {
    id: "plantings",
    nameKey: "nav.plantings",
    icon: GiPlantSeed,
    children: [
      { nameKey: "nav.myCrops", to: "/account/crop-types" },
      { nameKey: "nav.growLocations", to: "/account/fields" },
      { nameKey: "nav.cropPlan", to: "/account/crop-plan" },
      { nameKey: "nav.locationMap", to: "/account/plantings/location-map" },
      { nameKey: "nav.yieldComparison", to: "/account/harvests/yield-comparison" },
    ],
  },
  {
    id: "resources",
    nameKey: "nav.resources",
    icon: FaTractor,
    children: [
      { nameKey: "nav.equipment", to: "/account/resources/equipment" },
      { nameKey: "nav.warehouses", to: "/account/resources/warehouses" },
      { nameKey: "nav.inventory", to: "/account/stock" },
    ],
  },
  {
    id: "accounting",
    nameKey: "nav.accounting",
    icon: CalculatorIcon,
    children: [
      { nameKey: "nav.transactions", to: "/account/accounting/transactions" },
      { nameKey: "nav.plStatement", to: "/account/accounting/pl" },
      { nameKey: "nav.cashFlow", to: "/account/accounting/cash-flow" },
      { nameKey: "nav.balanceSheet", to: "/account/accounting/balance-sheet" },
      { nameKey: "nav.budgeting", to: "/account/accounting/budgeting" },
    ],
  },
  {
    id: "market",
    nameKey: "nav.market",
    icon: FaCashRegister,
    children: [
      { nameKey: "nav.marketDashboard", to: "/account/market" },
      { nameKey: "nav.products", to: "/account/market/products" },
      { nameKey: "nav.orders", to: "/account/market/orders" },
      { nameKey: "nav.marketSettings", to: "/account/market/settings" },
    ],
  },
  {
    id: "contacts",
    nameKey: "nav.contacts",
    icon: UserGroupIcon,
    to: "/account/contacts",
  },
  {
    id: "farmMap",
    nameKey: "nav.farmMap",
    icon: MapIcon,
    to: "/account/farm-map",
  },
  {
    id: "climate",
    nameKey: "nav.climate",
    icon: CloudIcon,
    children: [{ nameKey: "nav.weather", to: "/account/climate" }],
  },
  {
    id: "reports",
    nameKey: "nav.reports",
    icon: DocumentChartBarIcon,
    children: [{ nameKey: "nav.reportOverview", to: "/account/reports" }],
  },
];

function childActive(pathname: string, to: string) {
  if (to === "/account/reports") return pathname.startsWith("/account/reports");
  return pathname === to;
}

function sectionActive(pathname: string, section: NavSection) {
  if (section.to && !section.children?.length) {
    if (section.to === "/account") return pathname === "/account";
    if (section.to === "/account/activities") return pathname.startsWith("/account/activities");
    return pathname === section.to;
  }
  return section.children?.some((c) => childActive(pathname, c.to)) ?? false;
}

function initialOpen(pathname: string) {
  const open: Record<string, boolean> = {};
  SECTIONS.forEach((s) => {
    if (s.children) open[s.id] = sectionActive(pathname, s);
  });
  return open;
}

export default function AgricultureSidebarNav() {
  const { t } = useSafeT();
  const location = useLocation();
  const pathname = location.pathname;
  const [open, setOpen] = useState<Record<string, boolean>>(() => initialOpen(pathname));

  useEffect(() => {
    setOpen((prev) => {
      const next = { ...prev };
      SECTIONS.forEach((s) => {
        if (s.children && sectionActive(pathname, s)) next[s.id] = true;
      });
      return next;
    });
  }, [pathname]);

  const toggle = (id: string) => setOpen((prev) => ({ ...prev, [id]: !prev[id] }));

  const isLinkActive = (to: string) => {
    if (to === "/account") return pathname === "/account";
    if (to === "/account/reports") return pathname.startsWith("/account/reports");
    if (to === "/account/activities") return pathname.startsWith("/account/activities");
    return pathname === to;
  };

  return (
    <ul className="relative space-y-0.5">
      {SECTIONS.map((section) => {
        const Icon = section.icon;
        const hasChildren = Boolean(section.children?.length);
        const isOpen = open[section.id];
        const parentActive = sectionActive(pathname, section);

        if (!hasChildren && section.to) {
          const active = isLinkActive(section.to);
          return (
            <li key={section.id} className="nav-item">
              <Link to={section.to} className={`group ${active ? "active text-white" : ""}`}>
                <div className="flex items-center">
                  <Icon className="group-hover:!text-white shrink-0 w-5 h-5" />
                  <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-white/80 dark:group-hover:text-white">
                    {t(section.nameKey)}
                  </span>
                </div>
              </Link>
            </li>
          );
        }

        return (
          <li key={section.id} className="nav-item">
            <button
              type="button"
              className={`group w-full ${parentActive ? "active text-white" : ""}`}
              onClick={() => toggle(section.id)}
              aria-expanded={isOpen}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Icon className="group-hover:!text-white shrink-0 w-5 h-5" />
                  <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-white/80 dark:group-hover:text-white">
                    {t(section.nameKey)}
                  </span>
                </div>
                <ChevronDownIcon
                  className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </div>
            </button>
            {isOpen && section.children && (
              <ul className="sub-menu">
                {section.children.map((child) => (
                  <li key={child.to}>
                    <Link to={child.to} className={isLinkActive(child.to) ? "active" : ""}>
                      {t(child.nameKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export const agricultureAdminLinks = [
  { nameKey: "nav.farmProfile", to: "/account/farm-profile", icon: null },
  { nameKey: "nav.users", to: "/account/users", icon: null },
  { nameKey: "nav.farms", to: "/account/farms", icon: null },
  { nameKey: "nav.activityLogs", to: "/account/activity-logs", icon: null },
];
