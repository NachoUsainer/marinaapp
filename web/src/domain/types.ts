import type { ISODate } from "@/lib/date";

// ───────── Moco cervical (Sensiplan, categorías S/S+) ─────────

export type CervicalMucus =
  | "NONE"
  | "DRY"
  | "STICKY"
  | "CREAMY"
  | "WATERY"
  | "EGG_WHITE";

export const MUCUS_ORDER: CervicalMucus[] = [
  "NONE",
  "DRY",
  "STICKY",
  "CREAMY",
  "WATERY",
  "EGG_WHITE",
];

interface MucusMeta {
  label: string;
  /** Nivel Sensiplan: 0 no fértil · 1 baja · 2 fértil real · 3 pico. */
  level: number;
  /** Puntuación 0-5 para la gráfica de barras. */
  score: number;
  hint: string;
}

export const MUCUS_META: Record<CervicalMucus, MucusMeta> = {
  NONE: { label: "Sin registro", level: 0, score: 0, hint: "Sin observación" },
  DRY: { label: "Seco", level: 0, score: 1, hint: "Categoría t · No fértil" },
  STICKY: { label: "Pegajoso", level: 1, score: 2, hint: "Categoría S · Fertilidad baja" },
  CREAMY: { label: "Cremoso", level: 2, score: 3, hint: "Categoría S+ · Fertilidad real" },
  WATERY: { label: "Acuoso", level: 2, score: 4, hint: "Categoría S+ · Fertilidad real" },
  EGG_WHITE: { label: "Elástico (clara de huevo)", level: 3, score: 5, hint: "Categoría S+ · Día Pico" },
};

export const MAX_MUCUS_SCORE = MUCUS_META.EGG_WHITE.score;

/** ¿Es moco fértil (categoría S+ o pico)? */
export function mucusIsFertile(m: CervicalMucus): boolean {
  return MUCUS_META[m].level >= 2;
}

/** ¿Es el moco máximo (define el Día Pico)? */
export function mucusIsPeak(m: CervicalMucus): boolean {
  return MUCUS_META[m].level === 3;
}

// ───────── Sangrado menstrual ─────────

export type MenstruationFlow = "NONE" | "SPOTTING" | "LIGHT" | "MEDIUM" | "HEAVY";

export const FLOW_ORDER: MenstruationFlow[] = [
  "NONE",
  "SPOTTING",
  "LIGHT",
  "MEDIUM",
  "HEAVY",
];

export const FLOW_LABEL: Record<MenstruationFlow, string> = {
  NONE: "Sin sangrado",
  SPOTTING: "Manchado",
  LIGHT: "Ligero",
  MEDIUM: "Medio",
  HEAVY: "Abundante",
};

// ───────── Test de ovulación (hormona luteinizante, LH) ─────────

export type LhResult = "NONE" | "NEGATIVE" | "POSITIVE";

export const LH_ORDER: LhResult[] = ["NONE", "NEGATIVE", "POSITIVE"];

export const LH_LABEL: Record<LhResult, string> = {
  NONE: "Sin test",
  NEGATIVE: "Negativo",
  POSITIVE: "Positivo (pico LH)",
};

// ───────── Registro diario ─────────

export interface DayEntry {
  date: ISODate;
  basalTemperature: number | null;
  cervicalMucus: CervicalMucus;
  menstruationFlow: MenstruationFlow;
  lhTest: LhResult;
  isCycleStart: boolean;
  notes: string;
}

export function emptyEntry(date: ISODate): DayEntry {
  return {
    date,
    basalTemperature: null,
    cervicalMucus: "NONE",
    menstruationFlow: "NONE",
    lhTest: "NONE",
    isCycleStart: false,
    notes: "",
  };
}

// ───────── Ajustes de ciclo ─────────

export interface CycleSettings {
  averageCycleLength: number;
  averagePeriodLength: number;
  lutealPhaseLength: number;
}

export const DEFAULT_CYCLE_LENGTH = 28;
export const DEFAULT_PERIOD_LENGTH = 5;
export const DEFAULT_LUTEAL_PHASE = 14;
export const MIN_CYCLE_LENGTH = 21;
export const MAX_CYCLE_LENGTH = 40;

export const DEFAULT_SETTINGS: CycleSettings = {
  averageCycleLength: DEFAULT_CYCLE_LENGTH,
  averagePeriodLength: DEFAULT_PERIOD_LENGTH,
  lutealPhaseLength: DEFAULT_LUTEAL_PHASE,
};

// ───────── Estado de fertilidad ─────────

export type FertilityStatus =
  | "INFERTILE"
  | "FERTILE"
  | "PEAK"
  | "UNCERTAIN"
  | "MENSTRUATION";

// ───────── Resultados del análisis ─────────

export interface CycleAnalysis {
  cycleStartDate: ISODate;
  cycleEndDate: ISODate | null;
  cycleLength: number | null;
  peakDay: ISODate | null;
  temperatureShiftDay: ISODate | null;
  /** Primer test de LH positivo del ciclo (pico de LH). */
  lhSurgeDate: ISODate | null;
  /** Día de la primera medición elevada (FHM), base de la regla menos-8. */
  firstHigherMeasurementDate: ISODate | null;
  nadirDate: ISODate | null;
  averageLowTemperature: number | null;
  /** Línea base de Sensiplan = la MÁS ALTA de las 6 temperaturas bajas previas. */
  coverlineTemperature: number | null;
  estimatedOvulationDate: ISODate | null;
  confirmedInfertileFrom: ISODate | null;
  lutealLength: number | null;
  isUncertain: boolean;
}

export function isOvulationConfirmed(a: CycleAnalysis): boolean {
  return a.peakDay != null && a.temperatureShiftDay != null;
}

export interface DayInsight {
  date: ISODate;
  status: FertilityStatus;
  cycleDay: number | null;
  isMenstruation: boolean;
  isPeakDay: boolean;
  isOvulationEstimate: boolean;
  isTemperatureShiftDay: boolean;
  isLhSurge: boolean;
  isNadir: boolean;
  isUncertain: boolean;
  explanation: string;
}

export interface FertilityResult {
  statusByDate: Record<ISODate, DayInsight>;
  analyses: CycleAnalysis[];
  averageCycleLength: number;
  averageLutealLength: number;
  shortestCycleLength: number | null;
  cyclesUsedForLuteal: number;
  /**
   * Próxima ovulación prevista (>= hoy). Fuente ÚNICA de verdad: coincide
   * exactamente con el día que el calendario pinta como ovulación/pico previsto.
   */
  predictedOvulation: ISODate | null;
  /** Próxima menstruación prevista (>= hoy). */
  predictedNextPeriod: ISODate | null;
}

export function activeCycle(result: FertilityResult): CycleAnalysis | null {
  return result.analyses.length ? result.analyses[result.analyses.length - 1] : null;
}

// ───────── Paleta de estados (mismos hex que la app Android) ─────────

export interface StatusPalette {
  bg: string;
  fg: string;
  label: string;
}

export const STATUS_PALETTE: Record<FertilityStatus, StatusPalette> = {
  INFERTILE: { bg: "#D7F1E5", fg: "#00875A", label: "Baja" },
  FERTILE: { bg: "#FFE9B0", fg: "#B95E00", label: "Alta" },
  PEAK: { bg: "#E6D6F8", fg: "#6516B0", label: "Máxima" },
  MENSTRUATION: { bg: "#FFC1C1", fg: "#B00020", label: "Menstruación" },
  UNCERTAIN: { bg: "#E5E5EA", fg: "#6C6C70", label: "Incierto" },
};
