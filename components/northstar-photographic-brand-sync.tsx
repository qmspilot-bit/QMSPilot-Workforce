"use client";

import { useEffect } from "react";
import { NORTHSTAR_OFFICIAL_LOGO_DATA_URI } from "@/lib/northstar-official-logo";

const NORTHSTAR_ALT = /^northstar$/i;

function applyBrand(image: HTMLImageElement) {
  if (!NORTHSTAR_ALT.test(image.alt.trim())) return;

  image.src = NORTHSTAR_OFFICIAL_LOGO_DATA_URI;
  image.dataset.northstarBrand = "official-photographic-master";
  image.style.objectFit = "contain";
  image.style.objectPosition = "center";
  image.style.width = "100%";
  image.style.height = "100%";
  image.removeAttribute("srcset");
}

function synchronize(root: ParentNode = document) {
  root.querySelectorAll<HTMLImageElement>("img[alt]").forEach(applyBrand);
}

export function NorthstarPhotographicBrandSync() {
  useEffect(() => {
    synchronize();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node instanceof HTMLImageElement) applyBrand(node);
          synchronize(node);
        });
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
