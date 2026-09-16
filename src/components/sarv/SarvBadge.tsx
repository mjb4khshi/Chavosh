import React, { type ReactNode } from "react";

const VARIANTS = new Set(["primary", "success", "warn", "danger", "secondary", "info", "accent", "neutral"]);

const ALIAS: Record<string, string> = {
  sunset: "warn",
  emerald: "success",
  duration: "accent",
  rose: "danger",
  royal: "primary",
};

const BADGE_MAP: Record<string, Record<string, string>> = {
  solid: {
    primary: "badge-primary",
    secondary: "badge-secondary",
    accent: "badge-accent",
    success: "badge-success",
    warn: "badge-warn",
    danger: "badge-danger",
    info: "badge-info",
    neutral: "badge-neutral",
  },
  soft: {
    primary: "badge-soft-primary",
    secondary: "badge-soft-secondary",
    accent: "badge-soft-accent",
    success: "badge-soft-success",
    warn: "badge-soft-warn",
    danger: "badge-soft-danger",
    info: "badge-soft-info",
    neutral: "badge-soft-neutral",
  },
  outline: {
    primary: "badge-outline-primary",
    secondary: "badge-outline-secondary",
    accent: "badge-outline-accent",
    success: "badge-outline-success",
    warn: "badge-outline-warn",
    danger: "badge-outline-danger",
    info: "badge-outline-info",
    neutral: "badge-outline-neutral",
  },
};

export interface SarvBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: ReactNode;
  variant?: string;
  soft?: boolean;
  outline?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  icon?: ReactNode;
  dot?: boolean;
}

export default function SarvBadge({
  children,
  variant = "primary",
  soft = false,
  outline = false,
  size = "md",
  className = "",
  icon = null,
  dot = false,
  ...props
}: SarvBadgeProps) {
  const base = ALIAS[variant] || (VARIANTS.has(variant) ? variant : "primary");
  const styleKey = outline ? "outline" : soft ? "soft" : "solid";
  const variantClass = BADGE_MAP[styleKey]?.[base] || BADGE_MAP[styleKey].primary;

  let badgeClass = `badge ${variantClass}`;

  // Sarv UI official badge spec (badge.js): 0.75rem font · 2px 8px padding
  // Sizes only adjust font-scale while keeping the official padding rhythm
  if (size === "xs") badgeClass += " text-[10px] px-1.5 py-px";
  if (size === "sm") badgeClass += " text-[11px] px-2 py-0.5";
  if (size === "lg") badgeClass += " text-sm px-2.5 py-1";

  return (
    <span
      className={`${badgeClass} ${className}`}
      style={{ display: "inline-flex", alignItems: "center" }}
      {...props}
    >
      {dot && (
        <span
          className="inline-block w-1.5 h-1.5 rounded-full ml-1.5 animate-pulse"
          style={{ background: "currentColor" }}
        />
      )}
      {icon && <span className="inline-flex items-center text-xs mr-1">{icon}</span>}
      {children}
    </span>
  );
}
