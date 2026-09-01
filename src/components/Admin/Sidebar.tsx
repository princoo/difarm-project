import PerfectScrollbar from "react-perfect-scrollbar";
import { isLoggedIn } from "@/hooks/api/auth";
import { toggleSidebar } from "@/store/themeConfigSlice";
import {
  BuildingOffice2Icon,
  Cog6ToothIcon,
  DocumentChartBarIcon,
} from "@heroicons/react/24/outline";
import { FaSwatchbook } from "react-icons/fa";
import { GiGoat } from "react-icons/gi";
import { useDispatch } from "react-redux";
import { useSafeT } from "@/hooks/useSafeT";
import { useLocation, Link } from "@/lib/router-compat";
import IconBolt from "../Icon/IconBolt";
import IconCaretsDown from "../Icon/IconCaretsDown";
import IconCow from "../Icon/IconCow";
import IconHelpCircle from "../Icon/IconHelpCircle";
import IconHome from "../Icon/IconHome";
import IconTrashLines from "../Icon/IconTrashLines";
import IconUsers from "../Icon/IconUsers";
import Logo from "@/assets/landing/logo-nav-transparent.png";
import { imageSrc } from "@/lib/image-src";

const Sidebar = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const user = isLoggedIn();
  const { t } = useSafeT();

  const navigation = [
    {
      nameKey: "nav.dashboard",
      to: "/account",
      icon: IconHome,
      current: location.pathname === "/account",
      roles: ["SUPERADMIN", "ADMIN", "MANAGER", "VETERINARIAN"],
    },
    {
      nameKey: "nav.farmProfile",
      to: "/account/farm-profile",
      icon: BuildingOffice2Icon,
      current: location.pathname === "/account/farm-profile",
      roles: ["SUPERADMIN", "ADMIN", "MANAGER", "VETERINARIAN"],
    },
    {
      nameKey: "nav.users",
      to: "/account/users",
      icon: IconUsers,
      current: location.pathname === "/account/users",
      roles: ["SUPERADMIN", "ADMIN"],
    },
    {
      nameKey: "nav.farms",
      to: "/account/farms",
      icon: IconHome,
      current:
        location.pathname === "/account/farms" ||
        location.pathname.startsWith("/account/farms/"),
      roles: ["SUPERADMIN", "ADMIN", "MANAGER"],
    },
    {
      nameKey: "nav.cattle",
      to: "/account/cattle",
      icon: IconCow,
      current: location.pathname === "/account/cattle",
      roles: ["SUPERADMIN", "ADMIN", "MANAGER", "VETERINARIAN"],
    },
    {
      nameKey: "nav.livestock",
      to: "/account/livestock",
      icon: GiGoat,
      current: location.pathname.startsWith("/account/livestock"),
      roles: ["SUPERADMIN", "ADMIN", "MANAGER", "VETERINARIAN"],
    },
    {
      nameKey: "nav.production",
      to: "/account/production",
      icon: FaSwatchbook,
      current: location.pathname.startsWith("/account/production"),
      roles: ["SUPERADMIN", "ADMIN", "MANAGER"],
    },
    {
      nameKey: "nav.wasteProduction",
      to: "/account/waste-logs",
      icon: IconTrashLines,
      current: location.pathname === "/account/waste-logs",
      roles: ["SUPERADMIN", "ADMIN", "MANAGER"],
    },
    {
      nameKey: "nav.stock",
      to: "/account/stock",
      icon: FaSwatchbook,
      current: location.pathname.startsWith("/account/stock"),
      roles: ["SUPERADMIN", "ADMIN", "MANAGER"],
    },
    {
      nameKey: "nav.health",
      to: "/account/health",
      icon: IconBolt,
      current: location.pathname === "/account/health",
      roles: ["SUPERADMIN", "ADMIN", "MANAGER", "VETERINARIAN"],
    },
    {
      nameKey: "nav.reports",
      to: "/account/reports",
      icon: DocumentChartBarIcon,
      current: location.pathname.startsWith("/account/reports"),
      roles: ["SUPERADMIN", "ADMIN", "MANAGER"],
    },
    {
      nameKey: "nav.activityLogs",
      to: "/account/activity-logs",
      icon: IconHelpCircle,
      current: location.pathname === "/account/activity-logs",
      roles: ["SUPERADMIN", "ADMIN", "MANAGER", "VETERINARIAN"],
    },
  ];

  return (
    <div className={"dark"}>
      <nav
        className={`sidebar capitalize fixed min-h-screen h-full top-0 bottom-0 w-[260px] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] z-50 transition-all duration-300`}
      >
        <div className="bg-white dark:bg-green-900 h-full">
          <div className="flex h-[88px] items-center justify-between gap-2 px-4">
            <div className="flex min-w-0 flex-1 items-center justify-center">
              <Link to="/account" className="flex items-center justify-center px-1">
                <img
                  src={imageSrc(Logo)}
                  alt="DiFarm"
                  className="h-9 w-auto max-w-[160px] object-contain object-center bg-transparent"
                />
              </Link>
            </div>

            <button
              type="button"
              className="collapse-icon flex h-8 w-8 shrink-0 items-center rounded-full hover:bg-gray-500/10 dark:text-white-light dark:hover:bg-white/10 transition duration-300 rtl:rotate-180"
              onClick={() => dispatch(toggleSidebar())}
            >
              <IconCaretsDown className="m-auto rotate-90" />
            </button>
          </div>
          <PerfectScrollbar className="h-[calc(100vh-88px)] relative">
            <ul className="relative space-y-0.5 p-4 pt-2">
              <li className="nav-item">
                <ul>
                  {navigation
                    .filter((item) => user && item.roles.includes(user.role))
                    .map((item) => (
                      <li key={item.to} className="nav-item">
                        <Link
                          to={item.to}
                          className={`group ${
                            item.current ? "active text-white" : ""
                          }`}
                        >
                          <div className="flex items-center">
                            <item.icon className="group-hover:!text-white shrink-0" />
                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-white/80 dark:group-hover:text-white">
                              {t(item.nameKey)}
                            </span>
                          </div>
                        </Link>
                      </li>
                    ))}

                  <li className="nav-item">
                    <Link
                      to="/account/profile"
                      className={`group ${
                        location.pathname === "/account/profile"
                          ? "active text-white"
                          : ""
                      }`}
                    >
                      <div className="flex items-center">
                        <Cog6ToothIcon className="group-hover:!text-white shrink-0" />
                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-white/80 dark:group-hover:text-white">
                          {t("nav.profile")}
                        </span>
                      </div>
                    </Link>
                  </li>
                </ul>
              </li>
            </ul>
          </PerfectScrollbar>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
