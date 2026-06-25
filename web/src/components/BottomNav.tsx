"use client";

export type Tab = "calendar" | "log" | "trends" | "settings";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "calendar", label: "Calendario", icon: "📅" },
  { id: "log", label: "Registro", icon: "✏️" },
  { id: "trends", label: "Tendencias", icon: "📈" },
  { id: "settings", label: "Ajustes", icon: "⚙️" },
];

export function BottomNav({
  current,
  onSelect,
}: {
  current: Tab;
  onSelect: (t: Tab) => void;
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-md border-t border-ios-sep bg-ios-card/90 backdrop-blur">
      <div className="flex">
        {TABS.map((t) => {
          const active = current === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className="flex flex-1 flex-col items-center gap-0.5 py-2"
              aria-current={active ? "page" : undefined}
            >
              <span className="text-lg leading-none" aria-hidden>
                {t.icon}
              </span>
              <span
                className={`text-[11px] ${
                  active ? "font-semibold text-brand-rose" : "text-ios-secondary"
                }`}
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
