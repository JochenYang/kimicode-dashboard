import React from "react";
// Import subpath to avoid broken package root (DIR_IMPORT of ./features).
import Kimi from "@lobehub/icons/es/Kimi";

/** Official Kimi mark from @lobehub/icons (Color variant). */
export default function KimiLogo({ size = 44, className, color = true }) {
  const Icon = color && Kimi?.Color ? Kimi.Color : Kimi;
  if (!Icon) return null;
  return (
    <span className={className} style={{ display: "inline-flex", lineHeight: 0 }}>
      <Icon size={size} />
    </span>
  );
}
