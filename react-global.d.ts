import type { CSSProperties as ReactCSSProperties, ReactNode as ReactReactNode } from "react";

declare global {
  namespace React {
    type ReactNode = ReactReactNode;
    type CSSProperties = ReactCSSProperties;
  }
}

export {};
