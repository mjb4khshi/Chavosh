import React, { type ReactNode } from "react";
import { motion } from "framer-motion";

export interface SarvStatCardProps {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subtitle?: string;
  accent?: "primary" | "success" | "warn" | "danger" | "info" | "accent" | "secondary";
  footer?: ReactNode;
  onClick?: () => void;
  progress?: number;
  delay?: number;
  className?: string;
}

export default function SarvStatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  accent = "primary",
  footer,
  onClick,
  progress,
  delay = 0,
  className = "",
}: SarvStatCardProps) {
  const accentVar = `var(--theme-color-${accent}, var(--theme-color-primary))`;

  const content = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral">{label}</span>
        {Icon && (
          <div
            className="w-9 h-9 shrink-0 rounded-[var(--radius-button,0.75rem)] flex items-center justify-center"
            style={{
              background: `color-mix(in oklab, ${accentVar} 14%, transparent)`,
              color: accentVar,
            }}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="space-y-1.5 mt-2">
        <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight" style={{ color: accentVar }}>
          {value}
        </div>
        {typeof progress === "number" && (
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: accentVar }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
              transition={{ duration: 0.7, delay: delay + 0.15, ease: "easeOut" }}
            />
          </div>
        )}
        {subtitle && (
          <div className="text-[11px] text-neutral font-medium flex items-center gap-1">
            {subtitle}
          </div>
        )}
      </div>

      {footer}
    </>
  );

  const cls = `sarv-card sarv-card-hover p-5 flex flex-col justify-between ${onClick ? "cursor-pointer" : ""} ${className}`;

  if (onClick) {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay }}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.99 }}
        className={`${cls} text-left w-full`}
      >
        {content}
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={cls}
    >
      {content}
    </motion.div>
  );
}
