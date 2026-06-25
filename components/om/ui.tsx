"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

/* ----------------------------- Button ----------------------------- */

type BtnVariant = "primary" | "ghost" | "danger" | "outline" | "subtle";

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant;
  size?: "sm" | "md";
}) {
  const variants: Record<BtnVariant, string> = {
    primary: "bg-brand-600 text-white hover:bg-brand-500 shadow-lg shadow-brand-600/25",
    ghost: "text-white/70 hover:bg-white/5 hover:text-white",
    danger: "bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-500/30",
    outline: "border border-white/15 text-white/80 hover:bg-white/5",
    subtle: "bg-white/5 text-white/80 hover:bg-white/10 border border-white/10",
  };
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2.5 text-sm" };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}

/* ------------------------------ Input ----------------------------- */

export function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/40 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`${inputCls} ${props.className ?? ""} [&>option]:bg-ink-800`}
    />
  );
}

/* ----------------------------- Badge ------------------------------ */

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "green" | "amber" | "red" | "blue" | "purple";
  className?: string;
}) {
  const tones = {
    neutral: "bg-white/10 text-white/70",
    green: "bg-emerald-500/15 text-emerald-300",
    amber: "bg-amber-500/15 text-amber-300",
    red: "bg-red-500/15 text-red-300",
    blue: "bg-sky-500/15 text-sky-300",
    purple: "bg-purple-500/15 text-purple-300",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/* ------------------------------ Card ------------------------------ */

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl bg-white/5 border border-white/10 ${className}`}>{children}</div>
  );
}

export function CardHeader({
  title,
  icon: Icon,
  action,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
      <h3 className="flex items-center gap-2 font-display font-bold text-base">
        {Icon && <Icon className="w-4.5 h-4.5 text-brand-400" />}
        {title}
      </h3>
      {action}
    </div>
  );
}

/* ---------------------------- Stat tile --------------------------- */

export function Stat({
  label,
  value,
  sub,
  icon: Icon,
  tone = "text-white",
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wider text-white/50">{label}</span>
        {Icon && <Icon className={`w-4 h-4 ${tone}`} />}
      </div>
      <p className={`text-2xl font-display font-bold ${tone}`}>{value}</p>
      {sub && <p className="text-xs text-white/50 mt-0.5">{sub}</p>}
    </Card>
  );
}

/* ---------------------------- Modal ------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative w-full ${wide ? "max-w-3xl" : "max-w-lg"} max-h-[90vh] overflow-y-auto rounded-2xl bg-ink-800 border border-white/15 shadow-2xl`}
      >
        <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b border-white/10 bg-ink-800/95 backdrop-blur z-10">
          <h3 className="font-display font-bold text-lg">{title}</h3>
          <button
            onClick={onClose}
            className="grid place-items-center w-8 h-8 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ----------------------- Confirm hook/button ---------------------- */

export function EmptyState({
  icon: Icon,
  title,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
}) {
  return (
    <div className="text-center py-12 text-white/40">
      <Icon className="w-8 h-8 mx-auto mb-3 opacity-50" />
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="text-xs mt-1">{hint}</p>}
    </div>
  );
}

/* -------------------------- File helpers -------------------------- */

/** Read a File into a base64 data URL (for in-memory image preview). */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
