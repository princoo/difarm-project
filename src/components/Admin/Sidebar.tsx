import PerfectScrollbar from "react-perfect-scrollbar";
import { isLoggedIn } from "@/hooks/api/auth";
import { toggleSidebar } from "@/store/themeConfigSlice";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import { FaSwatchbook } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { useLocation, Link } from "@/lib/router-compat";
import IconBolt from "../Icon/IconBolt";
import IconCaretsDown from "../Icon/IconCaretsDown";
import IconCow from "../Icon/IconCow";
import IconHelpCircle from "../Icon/IconHelpCircle";
import IconHome from "../Icon/IconHome";
import IconTrashLines from "../Icon/IconTrashLines";
import IconUsers from "../Icon/IconUsers";
import Logo from "@/assets/logo.png";
import { imageSrc } from "@/lib/image-src";

const Sidebar = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const user = isLoggedIn();

  const navigation = [
    {
      name: "Dashboard",
      to: "/account",
      icon: IconHome,
      current: location.pathname === "/account",
      roles: ["SUPERADMIN", "ADMIN", "MANAGER", "VETERINARIAN"],
    },
    {
      name: "Users",
      to: "/account/users",
      icon: IconUsers,
      current: location.pathname === "/account/users",
      roles: ["SUPERADMIN", "ADMIN"],
    },
    {
      name: "Farms",
      to: "/account/farms",
      icon: IconHome,
      current: location.pathname === "/account/farms",
      roles: ["SUPERADMIN", "ADMIN", "MANAGER"],
    },
    {
      name: "Cattle",
      to: "/account/cattle",
      icon: IconCow,
      current: location.pathname === "/account/cattle",
      roles: ["SUPERADMIN", "ADMIN", "MANAGER", "VETERINARIAN"],
    },
    {
      name: "Production",
      to: "/account/production",
      icon: FaSwatchbook,
      current: location.pathname.startsWith("/account/production"),
      roles: ["SUPERADMIN", "ADMIN", "MANAGER"],
    },
    {
      name: "Waste Production",
      to: "/account/waste-logs",
      icon: IconTrashLines,
      current: location.pathname === "/account/waste-logs",
      roles: ["SUPERADMIN", "ADMIN", "MANAGER"],
    },
    {
      name: "Stock",
      to: "/account/stock",
      icon: FaSwatchbook,
      current: location.pathname.startsWith("/account/stock"),
      roles: ["SUPERADMIN", "ADMIN", "MANAGER"],
    },
    {
      name: "Health",
      to: "/account/health",
      icon: IconBolt,
      current: location.pathname === "/account/health",
      roles: ["SUPERADMIN", "ADMIN", "MANAGER", "VETERINARIAN"],
    },
    {
      name: "Activity logs",
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
          <div className="flex justify-between items-center px-4 py-3">
            <div className="w-full flex flex-col items-center justify-center">
              <div className="flex flex-col items-center justify-center">
                <img src={imageSrc(Logo)} alt="DiFarm" className="h-12 w-auto mb-1" />
                <p className="text-lg font-extrabold text-primary">
                  <span className="text-3xl text-white">DiFarm</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              className="collapse-icon w-8 h-8 rounded-full flex items-center hover:bg-gray-500/10 dark:hover:bg-white/10 dark:text-white-light transition duration-300 rtl:rotate-180"
              onClick={() => dispatch(toggleSidebar())}
            >
              <IconCaretsDown className="m-auto rotate-90" />
            </button>
          </div>
          <div className="h-10"></div>
          <PerfectScrollbar className="h-[calc(100vh)] relative">
            <ul className="relative space-y-0.5 p-4 py-0">
              <li className="nav-item">
                <ul>
                  {navigation
                    .filter((item) => user && item.roles.includes(user.role))
                    .map((item, index) => (
                      <li key={index} className="nav-item">
                        <Link
                          to={item.to}
                          className={`group ${
                            item.current ? "active text-white" : ""
                          }`}
                        >
                          <div className="flex items-center">
                            <item.icon className="group-hover:!text-white shrink-0" />
                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-white/80 dark:group-hover:text-white">
                              {item.name}
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
                          Profile
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
