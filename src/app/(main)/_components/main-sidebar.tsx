"use client";

import { Tooltip } from "@heroui/react";
import {
  ChartLineUpIcon,
  ClockCounterClockwiseIcon,
  HouseSimpleIcon,
  LightningIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

const MainSidebar = () => {
  const pathname = usePathname();

  const links = [
    {
      href: "/home",
      label: "Dashboard",
      icon: <HouseSimpleIcon size={20} weight={pathname === "/home" ? "fill" : "regular"} />,
      active: pathname === "/home",
    },
    {
      href: "/test-generator",
      label: "AI Test Generator",
      icon: <LightningIcon size={20} weight={pathname === "/test-generator" ? "fill" : "regular"} />,
      active: pathname === "/test-generator",
    },
    {
      href: "/analysis",
      label: "Analytics & AI Coach",
      icon: <ChartLineUpIcon size={20} weight={pathname === "/analysis" ? "fill" : "regular"} />,
      active: pathname === "/analysis",
    },
    {
      href: "/history",
      label: "Test History",
      icon: <ClockCounterClockwiseIcon size={20} weight={pathname === "/history" ? "fill" : "regular"} />,
      active: pathname === "/history",
    },
  ];

  return (
    <aside className="w-full md:w-20 bg-white dark:bg-[#262A42] border-t md:border-t-0 md:border-r border-[#E5E1EE] dark:border-[#3A3D57] flex md:flex-col items-center justify-around md:justify-start md:pt-6 gap-3 p-2 z-20">
      {links.map((link) => (
        <Tooltip key={link.href} content={link.label} placement="right">
          <Link
            href={link.href}
            className={`flex flex-col md:flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all ${
              link.active
                ? "bg-[#6C5CE7]/10 text-[#6C5CE7] dark:text-[#A89BF5] dark:bg-[#6C5CE7]/15 shadow-sm"
                : "text-[#8B86A3] dark:text-[#9B97B0] hover:text-[#6C5CE7] dark:hover:text-[#A89BF5] hover:bg-[#F3F1FA] dark:hover:bg-[#33365A]"
            }`}
          >
            {link.icon}
            <span className="text-[10px] font-medium tracking-tight mt-1 hidden sm:inline md:hidden lg:inline">
              {link.label.split(" ")[0]}
            </span>
          </Link>
        </Tooltip>
      ))}
    </aside>
  );
};

export default MainSidebar;
