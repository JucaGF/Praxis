// src/components/ui.jsx
import React from "react";

export function Pill({ children, className = "" }) {
  return <span className={"inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium " + className}>{children}</span>;
}

export function Difficulty({ level }) {
  const map = {
    Fácil: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    Médio: "bg-amber-50 text-amber-700 border border-amber-200",
    Difícil: "bg-rose-50 text-rose-700 border border-rose-200",
    "Em breve": "bg-zinc-50 text-zinc-600 border border-zinc-200",
  };
  return <Pill className={map[level] || map["Em breve"]}>{level}</Pill>;
}

export function Skill({ children }) {
  return <span className="inline-flex items-center rounded-md bg-zinc-50 border border-zinc-200 px-2 py-0.5 text-xs text-zinc-700">{children}</span>;
}

export function Meta({ icon, children }) {
  return <div className="inline-flex items-center gap-2 text-sm text-zinc-600"><span>{icon}</span><span>{children}</span></div>;
}

export function Card({ children, className = "", ...props }) {
  return (
    <article
      {...props}
      className={
        "relative rounded-2xl bg-white border border-zinc-200 shadow-sm " +
        "transition " +
        className
      }
    >
      {children}
    </article>
  );
}

export function PrimaryButton({ children, disabled, className = "" }) {
  const base = "w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition";
  return <button disabled={disabled} className={`${base} ${disabled ? "bg-primary-200 text-primary-700/60 cursor-not-allowed" : "bg-primary-500 text-zinc-900 hover:bg-primary-600"} ${className}`}>{children}</button>;
}
