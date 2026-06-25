"use client";

export type Tab = "calendar" | "log" | "trends" | "settings";

function CalendarIcon({ sw }: { sw: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <rect x="3" y="4.5" width="18" height="16.5" rx="3.5" />
      <path d="M3 9.5h18" />
      <path d="M8 2.5v3.5M16 2.5v3.5" />
    </svg>
  );
}

function LogIcon({ sw }: { sw: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <rect x="3" y="3" width="18" height="18" rx="5.5" />
      <path d="M12 8.2v7.6M8.2 12h7.6" />
    </svg>
  );
}

function TrendsIcon({ sw }: { sw: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <polyline points="3.5 15.5 9 10 13 14 20.5 6.5" />
      <polyline points="15.5 6.5 20.5 6.5 20.5 11.5" />
    </svg>
  );
}

function SettingsIcon({ sw }: { sw: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M3 7h9M16.5 7H21" />
      <circle cx="14.5" cy="7" r="2.2" />
      <path d="M3 17h4.5M12 17h9" />
      <circle cx="9.5" cy="17" r="2.2" />
    </svg>
  );
}

const TABS: { id: Tab; label: string; Icon: (p: { sw: number }) => JSX.Element }[] = [
  { id: "calendar", label: "Calendario", Icon: CalendarIcon },
  { id: "log", label: "Registro", Icon: LogIcon },
  { id: "trends", label: "Tendencias", Icon: TrendsIcon },
  { id: "settings", label: "Ajustes", Icon: SettingsIcon },
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
        {TABS.map(({ id, label, Icon }) => {
          const active = current === id;
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className={`flex flex-1 flex-col items-center gap-1 py-2 transition-colors ${
                active ? "text-brand-rose" : "text-ios-secondary"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon sw={active ? 2.1 : 1.7} />
              <span className={`text-[11px] ${active ? "font-semibold" : ""}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
