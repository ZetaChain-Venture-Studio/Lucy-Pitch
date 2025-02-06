"use client";

import React, { useCallback, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useOutsideClick } from "~~/hooks/scaffold-eth";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

export const menuLinks: HeaderMenuLink[] = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Pitch",
    href: "/pitch",
  },
  {
    label: "Portfolio",
    href: "/portfolio",
  },
  {
    label: "FAQ",
    href: "/faq",
  },
  // {
  //   label: "Debug Contracts",
  //   href: "/debug",
  //   icon: <BugAntIcon className="w-4 h-4" />,
  // },
];

export const HeaderMenuLinks = () => {
  const pathname = usePathname();

  return (
    <>
      {menuLinks.map(({ label, href, icon }, index) => {
        const isActive = pathname === href;
        return (
          <div className="flex items-center gap-4" key={index}>
            <li key={href}>
              <Link
                href={href}
                passHref
                className={`${
                  isActive ? "bg-[#002FFF] text-[#FFFFFF]" : ""
                } px-2 py-1 text-xl font-inter font-[1000] rounded-md`}
              >
                {icon}
                <span>{label}</span>
              </Link>
            </li>
            {index < menuLinks.length - 1 && <div className="w-px h-[30px] bg-[#000000]" />}
          </div>
        );
      })}
    </>
  );
};

/**
 * Site header
 */
export const Header = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const burgerMenuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(
    burgerMenuRef,
    useCallback(() => setIsDrawerOpen(false), []),
  );

  return (
    <div className="sticky top-0 z-20 flex-shrink-0 justify-between px-x min-h-0 lg:static navbar bg-[#FFFFFF] sm:px-6">
      <div className="lg:hidden dropdown" ref={burgerMenuRef}>
        <label
          tabIndex={0}
          className={`ml-1 btn btn-ghost ${isDrawerOpen ? "hover:bg-secondary" : "hover:bg-transparent"}`}
          onClick={() => {
            setIsDrawerOpen(prevIsOpenState => !prevIsOpenState);
          }}
        >
          <Bars3Icon className="h-1/2" />
        </label>
        {isDrawerOpen && (
          <ul
            tabIndex={0}
            className="p-2 mt-3 w-52 shadow menu menu-compact dropdown-content bg-base-100 rounded-box"
            onClick={() => {
              setIsDrawerOpen(false);
            }}
          >
            <HeaderMenuLinks />
          </ul>
        )}
      </div>
      <Link href="/" passHref className="hidden lg:flex">
        <div className="flex gap-3 relative h-[60px] justify-between items-center">
          <Image alt="logo" className="cursor-pointer" width={60} height={60} src="/logo.png" />
          <span className="font-jersey text-5xl">Pitch Lucy</span>
        </div>
      </Link>
      <ul className="hidden gap-4 px-1 lg:flex lg:flex-nowrap">
        <HeaderMenuLinks />
      </ul>
      <div className="w-[350px] flex justify-end">
        <RainbowKitCustomConnectButton />
        <FaucetButton />
      </div>
    </div>
  );
};
