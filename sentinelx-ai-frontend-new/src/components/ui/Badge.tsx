"use client";

import * as React from "react";

type BadgeVariant = "info" | "warning" | "success" | "critical" | "default" | "secondary" | "danger" | "outline";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  info: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  warning: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  success: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  critical: "bg-rose-500/10 text-rose-300 border-rose-500/20",
  default: "bg-white/10 text-white border-white/20",
  secondary: "bg-slate-500/10 text-slate-300 border-slate-500/20",
  danger: "bg-red-500/10 text-red-300 border-red-500/20",
  outline: "border border-white/10 bg-transparent text-slate-300",
};

export function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className}`}
      {...props}
    />
  );
}

export type { BadgeProps, BadgeVariant };
