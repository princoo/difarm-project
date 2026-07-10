import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "@/lib/router-compat";
import { AppDispatch, IRootState } from "@/store";
import { toggleTheme } from "../../store/themeConfigSlice";
import { toggleSidebar } from "@/store/themeConfigSlice";
import profile from "@/assets/images/background/widgets/second.png";
import { imageSrc } from "@/lib/image-src";
import IconLaptop from "@/components/Icon/IconLaptop";
import IconLogout from "@/components/Icon/IconLogout";
import IconMoon from "@/components/Icon/IconMoon";
import IconSun from "@/components/Icon/IconSun";
import IconUser from "@/components/Icon/IconUser";
import Dropdown from "@/components/dropdown";
import { storage } from "@/utils";
import { isLoggedIn } from "@/hooks/api/auth";
import { roleLabel } from "@/utils/permissions";
import { useGetFarmById } from "@/hooks/api/farms";
import { getFarmId, clearFarmId } from "@/utils/farmId";
import IconCaretsDown from "../Icon/IconCaretsDown";
import IconMenu from "../Icon/IconMenu";

const Header = () => {
  const isRtl =
    useSelector((state: IRootState) => state.themeConfig.rtlClass) === "rtl"
      ? true
      : false;

  const themeConfig = useSelector((state: IRootState) => state.themeConfig);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const [search, setSearch] = useState(false);

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
    navigate("/home");
  };

  const [farmScopeTick, setFarmScopeTick] = useState(0);
  useEffect(() => {
    const sync = () => setFarmScopeTick((n) => n + 1);
    window.addEventListener("difarm-farm-changed", sync);
    return () => window.removeEventListener("difarm-farm-changed", sync);
  }, []);

  const farmId = getFarmId() ?? "";
  const { farm, loading, error }: any = useGetFarmById(farmId);
  const isSa = user?.role === "SUPERADMIN";
  const farmLabel = farmId
    ? farm?.data?.name
    : isSa
      ? "All farms"
      : "";
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
            <Link to="/" className="main-logo flex shrink-0 items-center">
              <img
                className="inline w-8 ltr:-ml-1 rtl:-mr-1"
                src={imageSrc(profile)}
                alt="logo"
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
            <div className="sm:ltr:mr-auto sm:rtl:ml-auto">
              <p className="text-md">
                Welcome to{" "}
                <span className="font-bold capitalize">{farmLabel}</span>
              </p>
            </div>
            <div>
              {themeConfig.theme === "light" ? (
                <button
                  className={`${
                    themeConfig.theme === "light" &&
                    "flex items-center rounded-full bg-white-light/40 p-2 hover:bg-white-light/90 hover:text-primary dark:bg-dark/40 dark:hover:bg-dark/60"
                  }`}
                  onClick={() => {
                    dispatch(toggleTheme("dark"));
                  }}
                >
                  <IconSun />
                </button>
              ) : (
                ""
              )}
              {themeConfig.theme === "dark" && (
                <button
                  className={`${
                    themeConfig.theme === "dark" &&
                    "flex items-center rounded-full bg-white-light/40 p-2 hover:bg-white-light/90 hover:text-primary dark:bg-dark/40 dark:hover:bg-dark/60"
                  }`}
                  onClick={() => {
                    dispatch(toggleTheme("system"));
                  }}
                >
                  <IconMoon />
                </button>
              )}
              {themeConfig.theme === "system" && (
                <button
                  className={`${
                    themeConfig.theme === "system" &&
                    "flex items-center rounded-full bg-white-light/40 p-2 hover:bg-white-light/90 hover:text-primary dark:bg-dark/40 dark:hover:bg-dark/60"
                  }`}
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
                      Profile
                    </Link>
                  </li>
                  <li className="border-t border-white-light dark:border-white-light/10">
                    <button
                      onClick={() => {
                        Logout();
                      }}
                    >
                      <span className="flex flex-row !py-3 text-danger ">
                        <IconLogout className="h-4.5 w-4.5 shrink-0 rotate-90 ltr:mr-2 rtl:ml-2" />
                        Sign Out
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
