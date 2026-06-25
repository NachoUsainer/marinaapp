"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { analyze } from "@/domain/fertilityEngine";
import {
  CycleSettings,
  DayEntry,
  DEFAULT_SETTINGS,
  FertilityResult,
  MAX_CYCLE_LENGTH,
  MIN_CYCLE_LENGTH,
} from "@/domain/types";
import { ISODate } from "@/lib/date";
import { dataKeys } from "./profiles";

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function loadEntries(key: string): DayEntry[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DayEntry[];
    return parsed.sort((a, b) => (a.date < b.date ? -1 : 1));
  } catch {
    return [];
  }
}

function loadSettings(key: string): CycleSettings {
  try {
    const raw = localStorage.getItem(key);
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

export function useFertilityStore(profile: string): FertilityStore {
  const keys = useMemo(() => dataKeys(profile), [profile]);
  const [loaded, setLoaded] = useState(false);
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [settings, setSettings] = useState<CycleSettings>(DEFAULT_SETTINGS);

  // Carga inicial desde localStorage (solo cliente), reactiva al perfil activo.
  useEffect(() => {
    setLoaded(false);
    setEntries(loadEntries(keys.entries));
    setSettings(loadSettings(keys.settings));
    setLoaded(true);
  }, [keys]);

  // Persistencia.
  useEffect(() => {
    if (loaded) localStorage.setItem(keys.entries, JSON.stringify(entries));
  }, [entries, loaded, keys]);

  useEffect(() => {
    if (loaded) localStorage.setItem(keys.settings, JSON.stringify(settings));
  }, [settings, loaded, keys]);

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

  // Fuente única de verdad: el motor ya calcula la predicción coherente con el
  // calendario, así que la tarjeta y los colores nunca pueden contradecirse.
  const nextOvulation = result.predictedOvulation;
  const nextPeriod = result.predictedNextPeriod;

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
