"use client";

import { useEffect } from "react";
import { NORTHSTAR_OFFICIAL_LOGO_DATA_URI } from "@/lib/northstar-official-logo";

const NORTHSTAR_ALT = /^northstar$/i;

function applyOfficialNorthstarLogo(root: ParentNode = document) {
  root.querySelectorAll<HTMLImageElement>("img[alt]").forEach((image) => {
    if (!NORTHSTAR_ALT.test(image.alt.trim())) return;
    if (image.src === NORTHSTAR_OFFICIAL_LOGO_DATA_URI) return;

    image.src = NORTHSTAR_OFFICIAL_LOGO_DATA_URI;
    image.dataset.northstarBrand = "official";
    image.style.objectFit = "contain";
  });
}

export function NorthstarBrandSync() {
  useEffect(() => {
    applyOfficialNorthstarLogo();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node instanceof HTMLImageElement && NORTHSTAR_ALT.test(node.alt.trim())) {
            node.src = NORTHSTAR_OFFICIAL_LOGO_DATA_URI;
            node.dataset.northstarBrand = "official";
            node.style.objectFit = "contain";
          }
          applyOfficialNorthstarLogo(node);
        });
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
