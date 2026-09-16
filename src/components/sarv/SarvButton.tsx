import React, { type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

const VARIANTS = new Set(["primary", "success", "warn", "danger", "secondary", "info", "accent", "neutral"]);

const BUTTON_MAP: Record<string, Record<string, string>> = {
  solid: {
    primary: "btn-primary",
    secondary: "btn-secondary",
    accent: "btn-accent",
    success: "btn-success",
    warn: "btn-warn",
    danger: "btn-danger",
    info: "btn-info",
    neutral: "btn-neutral",
  },
  soft: {
    primary: "btn-soft-primary",
    secondary: "btn-soft-secondary",
    accent: "btn-soft-accent",
    success: "btn-soft-success",
    warn: "btn-soft-warn",
    danger: "btn-soft-danger",
    info: "btn-soft-info",
    neutral: "btn-soft-neutral",
  },
  outline: {
    primary: "btn-outline-primary",
    secondary: "btn-outline-secondary",
    accent: "btn-outline-accent",
    success: "btn-outline-success",
    warn: "btn-outline-warn",
    danger: "btn-outline-danger",
    info: "btn-outline-info",
    neutral: "btn-outline-neutral",
  },
  flat: {
    primary: "btn-flat-primary",
    secondary: "btn-flat-secondary",
    accent: "btn-flat-accent",
    success: "btn-flat-success",
    warn: "btn-flat-warn",
    danger: "btn-flat-danger",
    info: "btn-flat-info",
    neutral: "btn-flat-neutral",
  },
};

export interface SarvButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children?: ReactNode;
  variant?: string;
  styleType?: "solid" | "soft" | "outline" | "flat";
  size?: "xs" | "sm" | "md" | "lg" | "icon";
  className?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export default function SarvButton({
  children,
  variant = "primary",
  styleType,
  size = "md",
  className = "",
  icon = null,
  disabled = false,
  onClick,
  type = "button",
  ...props
}: SarvButtonProps) {
  let color = variant;
  let style = styleType;

  if (!styleType && ["flat", "outline", "soft", "solid"].includes(variant)) {
    style = variant === "solid" ? "solid" : (variant as any);
    color = "primary";
  }
  if (!VARIANTS.has(color)) color = "primary";
  if (!style) style = "solid";

  const styleGroup = BUTTON_MAP[style] || BUTTON_MAP.solid;
  const variantClass = styleGroup[color] || styleGroup.primary;
  // Sarv UI official button scale (sarv-ui/src/components/button.js):
  // xs: 4px 8px · sm: 6px 12px · md: 8px 16px · lg: 10px 20px
  let classes = `btn ${variantClass} gap-2 whitespace-nowrap`;

  if (size === "xs") classes += " text-[11px] py-1 px-2";
  if (size === "sm") classes += " text-xs py-1.5 px-3";
  if (size === "lg") classes += " text-base py-2.5 px-5";
  if (size === "icon") {
    classes += " p-2.5 aspect-square rounded-full flex items-center justify-center";
  }

  return (
    <motion.button
      type={type}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      disabled={disabled}
      onClick={onClick}
      className={`${classes} ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer"} ${className}`}
      {...props}
    >
      {icon && <span className="inline-flex items-center">{icon}</span>}
      {children}
    </motion.button>
  );
}
