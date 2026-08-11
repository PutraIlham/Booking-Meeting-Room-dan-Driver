"use client";

import { role } from "@/lib/data";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

const menuItems = [
  {
    icon: "/home.png",
    label: "Home",
    href: "/admin",
    visible: ["admin"],
  },
  {
    icon: "/calendar.png",
    label: "Bookings",
    visible: ["admin"],
    isDropdown: true,
    subItems: [
      {
        label: "Rooms",
        href: "/list/room-bookings",
        visible: ["admin"],
      },
      {
        label: "Transports",
        href: "/list/transport-bookings",
        visible: ["admin"],
      },
    ],
  },
  {
    icon: "/setting.png",
    label: "Manage",
    visible: ["admin"],
    isDropdown: true,
    subItems: [
      {
        label: "Rooms",
        href: "/manage/rooms",
        visible: ["admin"],
      },
      {
        label: "Transports",
        href: "/manage/transports",
        visible: ["admin"],
      },
      {
        label: "Users",
        href: "/manage/users",
        visible: ["admin"],
      },
    ],
  },
  {
    icon: "/profile.png",
    label: "Profile",
    href: "/profile",
    visible: ["admin"],
  },
  {
    icon: "/logout.png",
    label: "Logout",
    href: "/sign-in",
    onClick: () => {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminInfo");
    },
    visible: ["admin"],
  },
];

const Menu = () => {
  const [openDropdown, setOpenDropdown] = useState(null);

  const toggleDropdown = (label) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  const handleLogout = (onClick) => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div className="mt-4 text-sm">
      <div className="flex flex-col gap-2">
        {menuItems.map((item) => {
          if (item.visible.includes(role)) {
            if (item.isDropdown) {
              // Render dropdown menu
              return (
                <div key={item.label}>
                  <button
                    className="w-full flex items-center justify-center lg:justify-between gap-4 text-gray-500 py-2 md:px-2 rounded-md hover:bg-lamaSkyLight"
                    onClick={() => toggleDropdown(item.label)}
                  >
                    <div className="flex items-center gap-4">
                      <Image src={item.icon} alt="" width={20} height={20} />
                      <span className="hidden lg:block">{item.label}</span>
                    </div>
                    <span className="hidden lg:block">
                      {openDropdown === item.label ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </span>
                  </button>
                  
                  {/* Dropdown items */}
                  {openDropdown === item.label && (
                    <div className="pl-8 mt-1">
                      {item.subItems.map((subItem) => {
                        if (subItem.visible.includes(role)) {
                          return (
                            <Link
                              href={subItem.href}
                              key={subItem.label}
                              className="flex items-center py-2 text-gray-500 hover:text-gray-700"
                            >
                              <span className="hidden lg:block">{subItem.label}</span>
                            </Link>
                          );
                        }
                        return null;
                      })}
                    </div>
                  )}
                </div>
              );
            } else {
              // Render normal menu item
              return (
                <Link
                  href={item.href}
                  key={item.label}
                  className="flex items-center justify-center lg:justify-start gap-4 text-gray-500 py-2 md:px-2 rounded-md hover:bg-lamaSkyLight"
                  onClick={() => handleLogout(item.onClick)}
                >
                  <Image src={item.icon} alt="" width={20} height={20} />
                  <span className="hidden lg:block">{item.label}</span>
                </Link>
              );
            }
          }
          return null;
        })}
      </div>
    </div>
  );
};

export default Menu;