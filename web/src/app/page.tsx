"use client";

import { useState } from "react";
import { BottomNav, Tab } from "@/components/BottomNav";
import { CalendarScreen } from "@/components/CalendarScreen";
import { DailyLogScreen } from "@/components/DailyLogScreen";
import { SettingsScreen } from "@/components/SettingsScreen";
import { TrendsScreen } from "@/components/TrendsScreen";
import { useFertilityStore } from "@/data/store";
import { activeCycle } from "@/domain/types";
import { ISODate, todayISO } from "@/lib/date";

export default function Home() {
  const store = useFertilityStore();
  const [tab, setTab] = useState<Tab>("calendar");
  const [selectedDate, setSelectedDate] = useState<ISODate>(todayISO());
  const [month, setMonth] = useState(() => {
    const t = todayISO();
    return { year: Number(t.slice(0, 4)), month: Number(t.slice(5, 7)) };
  });

  if (!store.loaded) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center justify-center bg-ios-bg text-ios-secondary">
        Cargando…
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-md bg-ios-bg pb-16">
      {tab === "calendar" && (
        <CalendarScreen
          store={store}
          month={month}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onShowMonth={setMonth}
        />
      )}
      {tab === "log" && (
        <DailyLogScreen
          selectedDate={selectedDate}
          entry={store.entriesByDate[selectedDate]}
          onSave={store.saveEntry}
          onClear={() => store.clearEntry(selectedDate)}
        />
      )}
      {tab === "trends" && (
        <TrendsScreen
          entries={store.entries.slice(-60)}
          analysis={activeCycle(store.result)}
        />
      )}
      {tab === "settings" && <SettingsScreen store={store} />}

      <BottomNav current={tab} onSelect={setTab} />
    </main>
  );
}
