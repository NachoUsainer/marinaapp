"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { analyze } from "@/domain/fertilityEngine";
import {
  activeCycle,
  CycleSettings,
  DayEntry,
  DEFAULT_SETTINGS,
  FertilityResult,
  MAX_CYCLE_LENGTH,
  MIN_CYCLE_LENGTH,
} from "@/domain/types";
import { addDays, ISODate, todayISO } from "@/lib/date";

const ENTRIES_KEY = "ft_entries";
const SETTINGS_KEY = "ft_settings";

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function loadEntries(): DayEntry[] {
  try {
    const raw = localStorage.getItem(ENTRIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DayEntry[];
    return parsed.sort((a, b) => (a.date < b.date ? -1 : 1));
  } catch {
    return [];
  }
}

function loadSettings(): CycleSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<CycleSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export interface FertilityStore {
  loaded: boolean;
  entries: DayEntry[];
  entriesByDate: Record<ISODate, DayEntry>;
  settings: CycleSettings;
  result: FertilityResult;
  nextOvulation: ISODate | null;
  nextPeriod: ISODate | null;
  saveEntry: (entry: DayEntry) => void;
  clearEntry: (date: ISODate) => void;
  updateCycleLength: (days: number) => void;
  updatePeriodLength: (days: number) => void;
  updateLutealLength: (days: number) => void;
}

export function useFertilityStore(): FertilityStore {
  const [loaded, setLoaded] = useState(false);
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [settings, setSettings] = useState<CycleSettings>(DEFAULT_SETTINGS);

  // Carga inicial desde localStorage (solo cliente).
  useEffect(() => {
    setEntries(loadEntries());
    setSettings(loadSettings());
    setLoaded(true);
  }, []);

  // Persistencia.
  useEffect(() => {
    if (loaded) localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  }, [entries, loaded]);

  useEffect(() => {
    if (loaded) localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings, loaded]);

  const saveEntry = useCallback((entry: DayEntry) => {
    setEntries((prev) =>
      [...prev.filter((e) => e.date !== entry.date), entry].sort((a, b) =>
        a.date < b.date ? -1 : 1
      )
    );
  }, []);

  const clearEntry = useCallback((date: ISODate) => {
    setEntries((prev) => prev.filter((e) => e.date !== date));
  }, []);

  const updateCycleLength = useCallback((days: number) => {
    setSettings((s) => ({
      ...s,
      averageCycleLength: clamp(days, MIN_CYCLE_LENGTH, MAX_CYCLE_LENGTH),
    }));
  }, []);

  const updatePeriodLength = useCallback((days: number) => {
    setSettings((s) => ({ ...s, averagePeriodLength: clamp(days, 2, 10) }));
  }, []);

  const updateLutealLength = useCallback((days: number) => {
    setSettings((s) => ({ ...s, lutealPhaseLength: clamp(days, 10, 16) }));
  }, []);

  const result = useMemo<FertilityResult>(
    () =>
      analyze({
        cycleStarts: entries.filter((e) => e.isCycleStart).map((e) => e.date),
        entries,
        defaultCycleLength: settings.averageCycleLength,
        defaultLutealLength: settings.lutealPhaseLength,
      }),
    [entries, settings]
  );

  const entriesByDate = useMemo<Record<ISODate, DayEntry>>(() => {
    const map: Record<ISODate, DayEntry> = {};
    for (const e of entries) map[e.date] = e;
    return map;
  }, [entries]);

  const { nextOvulation, nextPeriod } = useMemo(() => {
    const active = activeCycle(result);
    const today = todayISO();
    const period = active
      ? addDays(active.cycleStartDate, result.averageCycleLength)
      : null;
    let ovulation: ISODate | null = null;
    if (active?.estimatedOvulationDate && active.estimatedOvulationDate >= today) {
      ovulation = active.estimatedOvulationDate;
    } else if (period) {
      ovulation = addDays(period, -result.averageLutealLength);
    }
    return { nextOvulation: ovulation, nextPeriod: period };
  }, [result]);

  return {
    loaded,
    entries,
    entriesByDate,
    settings,
    result,
    nextOvulation,
    nextPeriod,
    saveEntry,
    clearEntry,
    updateCycleLength,
    updatePeriodLength,
    updateLutealLength,
  };
}
