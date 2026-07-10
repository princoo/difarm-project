import React from "react";

 export const DashCard = ({ title, value, icon, backgroundColor, iconColor }: any) => {
  const iconStyles = {
    backgroundColor: backgroundColor,
    color: iconColor,
  };

  return (
    <div className="relative p-6 rounded-lg shadow-md flex flex-col justify-between bg-white dark:bg-black">
    <div className="flex items-center justify-between">
      <div>
        <div className="text-gray-600  dark:text-white/75 text-md">{title}</div>
        <div className="text-3xl font-semibold text-gray-800 dark:text-white/50 mt-2">{value}</div>
      </div>
      <div className="">
        <div
          className="absolute -top-2 text-[40px] p-5 shadow rounded right-1"
          style={iconStyles}
        >
          {icon}
        </div>
      </div>
    </div>
  </div>
  );
};
