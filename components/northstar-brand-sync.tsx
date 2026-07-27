"use client";

import { useEffect } from "react";

const NORTHSTAR_ALT = /^northstar$/i;

const OFFICIAL_NORTHSTAR_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1320 180" role="img" aria-label="Northstar">
  <defs>
    <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="0.34" stop-color="#d9dde2"/>
      <stop offset="0.7" stop-color="#8d949c"/>
      <stop offset="1" stop-color="#f1f3f5"/>
    </linearGradient>
    <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#67b7ff" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#9dd8ff" stop-opacity="0.95"/>
      <stop offset="1" stop-color="#67b7ff" stop-opacity="0"/>
    </linearGradient>
    <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="1320" height="180" fill="#020812"/>
  <path d="M0 171H1320" stroke="#193653" stroke-width="2"/>
  <text x="45" y="143" fill="url(#metal)" stroke="#6f767d" stroke-width="2.5" font-family="Arial Black, Impact, sans-serif" font-size="158" font-weight="900" letter-spacing="-8">NORTHST</text>
  <path d="M930 150 L977 18 L1024 150 L977 111 Z" fill="url(#metal)" stroke="#707780" stroke-width="2.5"/>
  <text x="1010" y="143" fill="url(#metal)" stroke="#6f767d" stroke-width="2.5" font-family="Arial Black, Impact, sans-serif" font-size="158" font-weight="900" letter-spacing="-8">R</text>
  <g filter="url(#glow)">
    <circle cx="977" cy="91" r="8" fill="#ffffff"/>
    <path d="M977 35V147M922 91H1032" stroke="#8ed2ff" stroke-width="3"/>
    <path d="M943 57L1011 125M1011 57L943 125" stroke="#d7f2ff" stroke-width="2"/>
  </g>
  <g filter="url(#glow)" opacity="0.92">
    <circle cx="1217" cy="91" r="6" fill="#ffffff"/>
    <path d="M1217 49V133M1176 91H1258" stroke="#82c9ff" stroke-width="2.5"/>
  </g>
  <path d="M760 173H1290" stroke="url(#beam)" stroke-width="3"/>
</svg>`;

const OFFICIAL_NORTHSTAR_LOGO = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(OFFICIAL_NORTHSTAR_SVG)}`;

function brandImage(image: HTMLImageElement) {
  if (!NORTHSTAR_ALT.test(image.alt.trim())) return;
  image.src = OFFICIAL_NORTHSTAR_LOGO;
  image.dataset.northstarBrand = "official-inline";
  image.style.objectFit = "contain";
  image.style.objectPosition = "center";
  image.removeAttribute("srcset");
}

function applyOfficialNorthstarLogo(root: ParentNode = document) {
  root.querySelectorAll<HTMLImageElement>("img[alt]").forEach(brandImage);
}

export function NorthstarBrandSync() {
  useEffect(() => {
    applyOfficialNorthstarLogo();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node instanceof HTMLImageElement) brandImage(node);
          applyOfficialNorthstarLogo(node);
        });
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
