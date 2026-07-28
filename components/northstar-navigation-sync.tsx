"use client";

import { useEffect } from "react";

export function NorthstarNavigationSync() {
  useEffect(() => {
    const syncNavigation = () => {
      document.querySelectorAll("nav").forEach((nav) => {
        const links = Array.from(nav.querySelectorAll<HTMLAnchorElement>("a"));
        const commandLink = links.find((link) => link.getAttribute("href") === "/" && link.textContent?.includes("Command Center"));
        const workspaceLink = links.find((link) => link.getAttribute("href") === "/toolbox");
        if (!commandLink || !workspaceLink) return;

        workspaceLink.childNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE && node.textContent?.includes("Digital Toolbox")) {
            node.textContent = node.textContent.replace("Digital Toolbox", "Workspaces");
          }
        });
        if (workspaceLink.textContent?.trim() === "Digital Toolbox") workspaceLink.textContent = "Workspaces";

        const existingIntelligence = links.find((link) => link.getAttribute("href") === "/executive-intelligence");
        if (!existingIntelligence) {
          const intelligenceLink = document.createElement("a");
          intelligenceLink.href = "/executive-intelligence";
          intelligenceLink.textContent = "Executive Intelligence";
          if (window.location.pathname === "/executive-intelligence") intelligenceLink.className = "active";
          commandLink.insertAdjacentElement("afterend", intelligenceLink);
        }
      });
    };

    syncNavigation();
    const observer = new MutationObserver(syncNavigation);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
