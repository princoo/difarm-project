import React, { useState, useRef, useEffect } from "react";
import { CiMenuBurger } from "react-icons/ci";
import { useLocation, useNavigate } from "@/lib/router-compat";
import VaccineRecords from "../vaccine";
import InseminationRecords from "../insemination";
import Veterinarians from "../veterians";

// Updated tabs array with components and route params
const tabs = [
  { 
    name: "Vaccination", 
    component: <VaccineRecords />, 
    routeParam: "vaccination" 
  },
  { 
    name: "Insemination", 
    component: <InseminationRecords />, 
    routeParam: "insemination" 
  },
  { 
    name: "Veterinarian", 
    component: <Veterinarians />, 
    routeParam: "veterinarian" 
  }
];

export default function Health() {
  const location = useLocation();
  const navigate = useNavigate();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeStyle, setActiveStyle] = useState({ left: "0px", width: "0px" });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const tabRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Set active tab based on URL query param when component mounts
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    if (tab) {
      const index = tabs.findIndex(t => t.routeParam === tab);
      if (index !== -1) {
        setActiveIndex(index);
      }
    }
  }, [location.search]);

  useEffect(() => {
    const activeElement = tabRefs.current[activeIndex];
    if (activeElement) {
      const { offsetLeft, offsetWidth } = activeElement;
      setActiveStyle({
        left: `${offsetLeft}px`,
        width: `${offsetWidth}px`,
      });
    }
  }, [activeIndex]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('tab','vaccination');
    searchParams.set('page','1');
    searchParams.set('pageSize','10');
    searchParams.set('search','');
    navigate({
      search: searchParams.toString()
    });
    requestAnimationFrame(() => {
      const overviewElement = tabRefs.current[0];
      if (overviewElement) {
        const { offsetLeft, offsetWidth } = overviewElement;
        setActiveStyle({
          left: `${offsetLeft}px`,
          width: `${offsetWidth}px`,
        });
      }
    });
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleTabClick = (index: number) => {
    setActiveIndex(index);
    // Update the URL with the selected tab's route param
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('tab', tabs[index].routeParam);
    searchParams.set('page','1');
    searchParams.set('pageSize','10');
    searchParams.set('search','');
    navigate({
      pathname: location.pathname,
      search: searchParams.toString()
    });
  };

  const handleMobileTabClick = (index: number) => {
    handleTabClick(index);
    setMobileMenuOpen(false);
  };

  return (
    <div
      className={`flex flex-col items-center w-full ${
        isDarkMode ? "dark bg-[#0e0f11]" : ""
      }`}
    >
      <div
        className={`w-full border-none shadow-none relative flex items-center justify-center ${
          isDarkMode ? "bg-transparent" : ""
        }`}
      >
        {/* Mobile Menu Button (visible on small screens) */}
        <div className="md:hidden bg-primary/80 p-2 w-full rounded-lg">
          <div className="flex items-center justify-between">
            <div className="font-medium text-white">{tabs[activeIndex].name}</div>
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-md hover:bg-gray-200 text-white hover:text-black dark:hover:bg-gray-800 transition-colors"
            >
              <CiMenuBurger size={24} />
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="absolute left-0 right-0 bg-white dark:bg-gray-900 shadow-lg z-10 mt-2 py-2 rounded-md">
              {tabs.map((tab, index) => (
                <div
                  key={index}
                  className={`px-4 py-3 cursor-pointer ${
                    index === activeIndex
                      ? "bg-primary/20 dark:bg-gray-800 text-[#0e0e10] dark:text-white"
                      : "text-[#0e0f1199] dark:text-[#ffffff99] hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                  onClick={() => handleMobileTabClick(index)}
                >
                  {tab.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Tabs (hidden on small screens) */}
        <div className="hidden md:block p-0">
          <div className="relative">
            {/* Active Indicator */}
            <div
              className="absolute bottom-[-6px] h-[2px] bg-primary dark:bg-primary transition-all duration-300 ease-out"
              style={activeStyle}
            />

            {/* Tabs */}
            <div className="relative flex space-x-[6px] items-center">
              {tabs.map((tab, index) => (
                <div
                  key={index}
                  ref={(el) => {
                    tabRefs.current[index] = el;
                  }}
                  className={`px-3 py-2 cursor-pointer transition-colors duration-300 h-[30px] ${
                    index === activeIndex
                      ? "text-primary dark:text-white"
                      : "text-[#0e0f1199] dark:text-[#ffffff99]"
                  }`}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => handleTabClick(index)}
                >
                  <div className="text-sm font-[var(--www-mattmannucci-me-geist-regular-font-family)] leading-5 whitespace-nowrap flex items-center justify-center h-full">
                    {tab.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Content area */}
      <div className="container mx-auto p-4">
        {/* Render the component based on the active tab */}
        {tabs[activeIndex].component}
      </div>
    </div>
  );
}