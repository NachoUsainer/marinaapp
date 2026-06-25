"use client";

import { ReactNode } from "react";
import { FertilityStatus, STATUS_PALETTE } from "@/domain/types";

/** Contenedor "inset grouped" estilo iOS. */
export function IosGroupedSection({
  title,
  footer,
  children,
}: {
  title?: string;
  footer?: string;
  children: ReactNode;
}) {
  return (
    <div className="w-full">
      {title && (
        <div className="px-8 pt-4 pb-1.5 text-xs uppercase tracking-wide text-ios-secondary">
          {title}
        </div>
      )}
      <div className="mx-4 overflow-hidden rounded-2xl bg-ios-card">{children}</div>
      {footer && (
        <div className="px-8 py-1.5 text-xs leading-snug text-ios-secondary">{footer}</div>
      )}
    </div>
  );
}

/** Fila estilo iOS con separador opcional. */
export function IosListRow({
  children,
  onClick,
  showDivider = true,
}: {
  children: ReactNode;
  onClick?: () => void;
  showDivider?: boolean;
}) {
  return (
    <div>
      <div
        className={`flex items-center px-4 py-3 ${
          onClick ? "cursor-pointer active:bg-black/5" : ""
        }`}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
      >
        {children}
      </div>
      {showDivider && <div className="ml-4 h-px bg-ios-sep" />}
    </div>
  );
}

export function IosLargeTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className="px-4 pb-2 pt-3 text-3xl font-bold text-ios-label">{children}</h1>
  );
}

export function StatusPill({ status }: { status: FertilityStatus }) {
  const pal = STATUS_PALETTE[status];
  return (
    <span
      className="rounded-lg px-2.5 py-1 text-xs font-semibold"
      style={{ backgroundColor: pal.bg, color: pal.fg }}
    >
      {pal.label}
    </span>
  );
}
