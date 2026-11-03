"use client";

import { authClient } from "@/lib/auth-client";
import {
  Avatar,
  Button,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Switch,
  Chip,
  Tooltip,
} from "@heroui/react";
import {
  UserIcon,
  SparkleIcon,
  DatabaseIcon,
  CpuIcon,
  LightningIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import React from "react";
import { DEFAULT_GUEST_REDIRECT } from "../../../../routes";
import { useRecruiter } from "@/context/recruiter-context";

const MainHeader = () => {
  const { data, isPending } = authClient.useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { openSchemaModal } = useRecruiter();

  const user = data?.user || {
    name: "Guest Student",
    email: "student@tcas.internal",
  };

  return (
    <Navbar
      isBordered
      maxWidth="full"
      className="bg-white dark:bg-[#262A42] border-b border-[#E5E1EE] dark:border-[#3A3D57] px-4 shadow-sm"
    >
      {/* Brand */}
      <NavbarContent justify="start" className="gap-4">
        <NavbarBrand as={Link} href="/home" className="gap-2.5 cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-[#6C5CE7] flex items-center justify-center text-white shadow-md">
            <LightningIcon size={18} weight="fill" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight text-[#2D2B3D] dark:text-white">
              TCAS{" "}
              <span className="text-[#6C5CE7] font-semibold text-xs ml-1 px-1.5 py-0.5 rounded bg-[#6C5CE7]/10 border border-[#6C5CE7]/20">
                CBT Engine
              </span>
            </span>
            <span className="text-[10px] text-[#8B86A3] dark:text-[#9B97B0] tracking-wider font-medium">
              ADAPTIVE TEST SYSTEM
            </span>
          </div>
        </NavbarBrand>

        {/* Quick Nav Links */}
        <div className="hidden md:flex items-center gap-1 ml-6">
          <Link
            href="/home"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              pathname === "/home"
                ? "bg-[#6C5CE7]/10 text-[#6C5CE7] dark:text-[#A89BF5] border border-[#6C5CE7]/20"
                : "text-[#6B6880] dark:text-[#9B97B0] hover:text-[#2D2B3D] dark:hover:text-white hover:bg-[#F3F1FA] dark:hover:bg-[#33365A]"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/test-generator"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              pathname === "/test-generator"
                ? "bg-[#6C5CE7]/10 text-[#6C5CE7] dark:text-[#A89BF5] border border-[#6C5CE7]/20"
                : "text-[#6B6880] dark:text-[#9B97B0] hover:text-[#2D2B3D] dark:hover:text-white hover:bg-[#F3F1FA] dark:hover:bg-[#33365A]"
            }`}
          >
            AI Test Generator
          </Link>
          <Link
            href="/analysis"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              pathname === "/analysis"
                ? "bg-[#6C5CE7]/10 text-[#6C5CE7] dark:text-[#A89BF5] border border-[#6C5CE7]/20"
                : "text-[#6B6880] dark:text-[#9B97B0] hover:text-[#2D2B3D] dark:hover:text-white hover:bg-[#F3F1FA] dark:hover:bg-[#33365A]"
            }`}
          >
            Analytics &amp; AI Coach
          </Link>
          <Link
            href="/history"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              pathname === "/history"
                ? "bg-[#6C5CE7]/10 text-[#6C5CE7] dark:text-[#A89BF5] border border-[#6C5CE7]/20"
                : "text-[#6B6880] dark:text-[#9B97B0] hover:text-[#2D2B3D] dark:hover:text-white hover:bg-[#F3F1FA] dark:hover:bg-[#33365A]"
            }`}
          >
            History
          </Link>
        </div>
      </NavbarContent>

      {/* Corner Action Controls */}
      <NavbarContent justify="end" className="gap-3">
        {/* Single View Tech Stack Button */}
        <NavbarItem>
          <Button
            size="sm"
            variant="bordered"
            className="text-xs flex items-center gap-1.5 border-[#6C5CE7]/30 text-[#6C5CE7] dark:text-[#A89BF5] dark:border-[#6C5CE7]/30 hover:bg-[#6C5CE7]/5 font-semibold rounded-lg px-3"
            onPress={openSchemaModal}
            startContent={<DatabaseIcon size={14} />}
          >
            View Tech Stack
          </Button>
        </NavbarItem>

        {/* Profile */}
        <NavbarItem>
          <Popover placement="bottom-end">
            <PopoverTrigger>
              <div className="cursor-pointer">
                <Avatar
                  size="sm"
                  isBordered
                  color="secondary"
                  fallback={<UserIcon size={16} />}
                  className="transition-transform ring-2 ring-[#E5E1EE] dark:ring-[#3A3D57]"
                />
              </div>
            </PopoverTrigger>
            <PopoverContent className="p-3 bg-white dark:bg-[#262A42] border border-[#E5E1EE] dark:border-[#3A3D57] text-[#2D2B3D] dark:text-white min-w-56 rounded-xl shadow-lg">
              <div className="flex flex-col gap-2">
                <div>
                  <h4 className="text-sm font-semibold text-[#2D2B3D] dark:text-white">{user.name}</h4>
                  <p className="text-xs text-[#8B86A3] dark:text-[#9B97B0] truncate">{user.email}</p>
                </div>
                <div className="h-px bg-[#E5E1EE] dark:bg-[#3A3D57] my-1" />
                <Button
                  size="sm"
                  variant="bordered"
                  className="text-xs text-[#4A4760] dark:text-[#9B97B0] border-[#E5E1EE] dark:border-[#3A3D57] justify-start hover:bg-[#F3F1FA] dark:hover:bg-[#33365A]"
                  startContent={<CpuIcon size={14} />}
                  onPress={openSchemaModal}
                >
                  System Architecture
                </Button>
                {data?.session && (
                  <Button
                    size="sm"
                    color="danger"
                    variant="flat"
                    className="text-xs mt-1"
                    onPress={() => {
                      authClient.signOut().then(() => {
                        router.push(DEFAULT_GUEST_REDIRECT);
                      });
                    }}
                  >
                    Log out
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
};

export default MainHeader;
