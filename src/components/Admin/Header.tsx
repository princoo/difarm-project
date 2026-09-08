import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "@/lib/router-compat";
import { useSafeT } from "@/hooks/useSafeT";
import { AppDispatch, IRootState } from "@/store";
import { toggleTheme, toggleSidebar } from "../../store/themeConfigSlice";
import profile from "@/assets/images/background/widgets/second.png";
import Logo from "@/assets/landing/logo-nav-transparent.png";
import { imageSrc } from "@/lib/image-src";
import IconLaptop from "@/components/Icon/IconLaptop";
import IconLogout from "@/components/Icon/IconLogout";
import IconMoon from "@/components/Icon/IconMoon";
import IconSun from "@/components/Icon/IconSun";
import IconUser from "@/components/Icon/IconUser";
import Dropdown from "@/components/dropdown";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { storage } from "@/utils";
import { isLoggedIn } from "@/hooks/api/auth";
import { roleLabel } from "@/utils/permissions";
import { useGetFarmById } from "@/hooks/api/farms";
import { getFarmId, clearFarmId } from "@/utils/farmId";
import { clearDashboardMode, getDashboardMode } from "@/utils/dashboardMode";
import HeaderFarmSelector from "./HeaderFarmSelector";
import IconMenu from "../Icon/IconMenu";

const Header = () => {
  const isRtl =
    useSelector((state: IRootState) => state.themeConfig.rtlClass) === "rtl";

  const themeConfig = useSelector((state: IRootState) => state.themeConfig);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { t } = useSafeT();

  const user = isLoggedIn();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const Logout = () => {
    storage.removeToken();
    localStorage.removeItem("Farm_user");
    clearFarmId();
    clearDashboardMode();
    navigate("/home");
  };

  const [farmScopeTick, setFarmScopeTick] = useState(0);
  useEffect(() => {
    const sync = () => setFarmScopeTick((n) => n + 1);
    window.addEventListener("difarm-farm-changed", sync);
    return () => window.removeEventListener("difarm-farm-changed", sync);
  }, []);

  const farmId = getFarmId() ?? "";
  const { farm }: any = useGetFarmById(farmId);
  const isSa = user?.role === "SUPERADMIN";
  const farmLabel = farmId
    ? farm?.data?.name
    : isSa
      ? t("header.allFarms")
      : "";
  const dashboardMode = getDashboardMode();
  void farmScopeTick;

  return (
    <header
      className={`z-40 ${
        themeConfig.semidark && themeConfig.menu === "horizontal" ? "dark" : ""
      }`}
    >
      <div className="shadow-sm">
        <div className="relative flex w-full items-center bg-white px-5 py-2.5 dark:bg-black">
          <div className="horizontal-logo flex items-center justify-between ltr:mr-2 rtl:ml-2 lg:hidden">
            <Link to="/account" className="main-logo flex shrink-0 items-center">
              <img
                className="inline h-8 w-auto max-w-[120px] object-contain bg-transparent ltr:-ml-1 rtl:-mr-1"
                src={imageSrc(Logo)}
                alt="DiFarm"
              />
            </Link>
            <button
              type="button"
              className="collapse-icon flex-none dark:text-[#d0d2d6] hover:text-primary dark:hover:text-primary flex lg:hidden ltr:ml-2 rtl:mr-2 p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:bg-white-light/90 dark:hover:bg-dark/60"
              onClick={() => {
                dispatch(toggleSidebar());
              }}
            >
              <IconMenu className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center space-x-1.5 ltr:ml-auto rtl:mr-auto rtl:space-x-reverse dark:text-[#d0d2d6] sm:flex-1 ltr:sm:ml-0 sm:rtl:mr-0 lg:space-x-2">
            <div className="sm:ltr:mr-auto sm:rtl:ml-auto min-w-0 flex flex-col sm:flex-row sm:items-center gap-2">
              <p className="text-md truncate">
                {t("header.welcomeTo")}{" "}
                <span className="font-bold capitalize">{farmLabel}</span>
              </p>
              {isSa && dashboardMode && (
                <HeaderFarmSelector />
              )}
              {isSa && dashboardMode && (
                <p className="text-xs text-teal-700 dark:text-teal-300 truncate">
                  {dashboardMode === "AGRICULTURE"
                    ? t("dashboard.agricultureWorkspace")
                    : t("dashboard.livestockWorkspace")}
                  {" · "}
                  <button
                    type="button"
                    className="underline hover:text-primary"
                    onClick={() => navigate("/choose-dashboard")}
                  >
                    {t("dashboard.switchWorkspace")}
                  </button>
                </p>
              )}
            </div>
            <LanguageSwitcher compact />
            <div>
              {themeConfig.theme === "light" ? (
                <button
                  className="flex items-center rounded-full bg-white-light/40 p-2 hover:bg-white-light/90 hover:text-primary dark:bg-dark/40 dark:hover:bg-dark/60"
                  onClick={() => {
                    dispatch(toggleTheme("dark"));
                  }}
                >
                  <IconSun />
                </button>
              ) : null}
              {themeConfig.theme === "dark" && (
                <button
                  className="flex items-center rounded-full bg-white-light/40 p-2 hover:bg-white-light/90 hover:text-primary dark:bg-dark/40 dark:hover:bg-dark/60"
                  onClick={() => {
                    dispatch(toggleTheme("system"));
                  }}
                >
                  <IconMoon />
                </button>
              )}
              {themeConfig.theme === "system" && (
                <button
                  className="flex items-center rounded-full bg-white-light/40 p-2 hover:bg-white-light/90 hover:text-primary dark:bg-dark/40 dark:hover:bg-dark/60"
                  onClick={() => {
                    dispatch(toggleTheme("light"));
                  }}
                >
                  <IconLaptop />
                </button>
              )}
            </div>
            <div className="dropdown flex shrink-0">
              <Dropdown
                offset={[0, 8]}
                placement={`${isRtl ? "bottom-start" : "bottom-end"}`}
                btnClassName="relative group block"
                button={
                  <img
                    className="h-9 w-9 rounded-full object-cover saturate-50 group-hover:saturate-100"
                    src={imageSrc(profile)}
                    alt="userProfile"
                  />
                }
              >
                <ul className="w-[230px] !py-0 font-semibold text-dark dark:text-white-dark dark:text-white-light/90">
                  <li>
                    <div className="flex items-center px-4 py-4">
                      <img
                        className="h-10 w-10 rounded-md object-cover"
                        src={imageSrc(profile)}
                        alt="userProfile"
                      />
                      <div className="truncate ltr:pl-4 rtl:pr-4">
                        <h4 className="text-base">
                          {user?.username || "User"}
                          <span className="rounded bg-success-light px-1 text-xs text-success ltr:ml-2 rtl:ml-2">
                            {" "}
                            {roleLabel(user?.role)}
                          </span>
                        </h4>
                        <button
                          type="button"
                          className="text-black/60 hover:text-primary dark:text-dark-light/60 dark:hover:text-white"
                        >
                          {user?.email || "email@example.com"}
                        </button>
                      </div>
                    </div>
                  </li>
                  <li>
                    <Link to={`profile`} className="dark:hover:text-white">
                      <IconUser className="h-4.5 w-4.5 shrink-0 ltr:mr-2 rtl:ml-2" />
                      {t("nav.profile")}
                    </Link>
                  </li>
                  <li className="border-t border-white-light dark:border-white-light/10">
                    <button onClick={Logout}>
                      <span className="flex flex-row !py-3 text-danger ">
                        <IconLogout className="h-4.5 w-4.5 shrink-0 rotate-90 ltr:mr-2 rtl:ml-2" />
                        {t("nav.signOut")}
                      </span>
                    </button>
                  </li>
                </ul>
              </Dropdown>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
