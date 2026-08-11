"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const primaryItems = [
  { href: "/", label: "Home" },
  { href: "/toolbox", label: "Work" },
  { href: "/my-actions", label: "My Actions" },
  { href: "/executive-intelligence", label: "Leadership" },
];

function isPrimaryNav(nav: HTMLElement) {
  if (nav.classList.contains("northstar-quick-actions") || nav.classList.contains("northstar-primary-nav")) return false;
  const hrefs = Array.from(nav.querySelectorAll<HTMLAnchorElement>("a")).map(link => link.getAttribute("href"));
  return hrefs.includes("/") && (hrefs.includes("/toolbox") || hrefs.includes("/dashboard") || hrefs.includes("/my-actions"));
}

function activeHref(pathname: string) {
  if (pathname === "/") return "/";
  if (pathname === "/my-actions") return "/my-actions";
  if (pathname === "/executive-intelligence" || pathname === "/dashboard" || pathname.startsWith("/workforce-operations") || pathname.startsWith("/entity-graph")) {
    return "/executive-intelligence";
  }
  if (pathname === "/toolbox" || pathname.startsWith("/smart-") || pathname.startsWith("/tools/")) return "/toolbox";
  return "";
}

export function NorthstarNavigationSync() {
  const pathname = usePathname();

  useEffect(() => {
    const active = activeHref(pathname);

    const syncNavigation = () => {
      document.querySelectorAll<HTMLElement>("nav").forEach(nav => {
        if (!isPrimaryNav(nav)) return;
        const signature = `${pathname}:${primaryItems.map(item => item.label).join("|")}`;
        if (nav.dataset.northstarPrimaryNav === signature) return;
        nav.innerHTML = "";
        primaryItems.forEach(item => {
          const link = document.createElement("a");
          link.href = item.href;
          link.textContent = item.label;
          if (item.href === active) link.className = "active";
          nav.appendChild(link);
        });
        nav.dataset.northstarPrimaryNav = signature;
      });
    };

    syncNavigation();
    const observer = new MutationObserver(syncNavigation);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
