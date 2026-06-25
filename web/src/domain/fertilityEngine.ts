import {
  addDays,
  daysBetween,
  ISODate,
  maxDate,
  rangeInclusive,
  todayISO,
} from "@/lib/date";
import {
  CycleAnalysis,
  DayEntry,
  DayInsight,
  DEFAULT_CYCLE_LENGTH,
  DEFAULT_LUTEAL_PHASE,
  FertilityResult,
  FertilityStatus,
  MUCUS_META,
  mucusIsFertile,
  mucusIsPeak,
} from "./types";

/**
 * Motor sintotérmico (Sensiplan) — puro, sin dependencias de framework.
 * Puerto fiel de FertilityEngine.kt.
 *
 *  • TEMPERATURA — 3 temps consecutivas ≥ media de las 6 previas + 0.1 °C,
 *    la 3ª ≥ media + 0.2 °C. Solo ventanas tras el día 6 del ciclo.
 *  • MOCO — Día Pico = último día con moco máximo (clara de huevo).
 *  • DOBLE CONTROL — fase infértil confirmada el día siguiente al más tardío
 *    entre (Pico+3) y el salto térmico.
 *  • DÖRING — apertura = (ciclo más corto − 20).
 *  • IRREGULARIDAD — desviación > 20% sobre la media de los últimos 6 ciclos.
 */

interface CycleSpan {
  start: ISODate;
  endIfClosed: ISODate | null;
}

interface TempShift {
  day: ISODate;
  lowAverage: number;
}

export interface AnalyzeParams {
  cycleStarts: ISODate[];
  entries: DayEntry[];
  defaultCycleLength?: number;
  defaultLutealLength?: number;
  /** Inyectable para tests; por defecto hoy. */
  today?: ISODate;
}

function average(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function takeLast<T>(xs: T[], n: number): T[] {
  return n >= xs.length ? xs.slice() : xs.slice(xs.length - n);
}

export function analyze(params: AnalyzeParams): FertilityResult {
  const defaultCycleLength = params.defaultCycleLength ?? DEFAULT_CYCLE_LENGTH;
  const defaultLutealLength = params.defaultLutealLength ?? DEFAULT_LUTEAL_PHASE;
  const today = params.today ?? todayISO();

  const sortedStarts = Array.from(new Set(params.cycleStarts)).sort();
  const entriesByDate: Record<ISODate, DayEntry> = {};
  for (const e of params.entries) entriesByDate[e.date] = e;

  if (sortedStarts.length === 0) {
    return {
      statusByDate: {},
      analyses: [],
      averageCycleLength: defaultCycleLength,
      averageLutealLength: defaultLutealLength,
      shortestCycleLength: null,
      cyclesUsedForLuteal: 0,
    };
  }

  const cycles: CycleSpan[] = sortedStarts.map((start, idx) => {
    const nextStart = sortedStarts[idx + 1];
    return { start, endIfClosed: nextStart ? addDays(nextStart, -1) : null };
  });

  const closedLengths = cycles
    .filter((c) => c.endIfClosed != null)
    .map((c) => daysBetween(c.start, c.endIfClosed as ISODate) + 1);

  const averageCycle = closedLengths.length
    ? Math.trunc(average(takeLast(closedLengths, 6)))
    : defaultCycleLength;
  const shortestCycle = closedLengths.length
    ? Math.min(...takeLast(closedLengths, 12))
    : null;

  const analyses = cycles.map((c) => analyzeCycle(c, entriesByDate, averageCycle, today));

  const lutealHistory = takeLast(
    analyses
      .map((a) => a.lutealLength)
      .filter((x): x is number => x != null),
    6
  );
  const averageLuteal = lutealHistory.length
    ? Math.trunc(average(lutealHistory))
    : defaultLutealLength;

  const statusByDate: Record<ISODate, DayInsight> = {};
  const effectiveShortest = shortestCycle ?? averageCycle;

  analyses.forEach((analysis, idx) => {
    const isLast = idx === cycles.length - 1;
    const projectionEnd = isLast
      ? addDays(cycles[idx].start, averageCycle - 1)
      : null;
    buildDailyInsights({
      cycle: cycles[idx],
      analysis,
      entriesByDate,
      shortestCycle: effectiveShortest,
      averageCycle,
      averageLuteal,
      projectionEnd,
      today,
      output: statusByDate,
    });
  });

  // Ciclos virtuales: solo predicción, sin biomarcadores.
  let phantomStart = addDays(cycles[cycles.length - 1].start, averageCycle);
  for (let i = 0; i < 2; i++) {
    const phantomCycle: CycleSpan = { start: phantomStart, endIfClosed: null };
    const phantomAnalysis: CycleAnalysis = {
      cycleStartDate: phantomStart,
      cycleEndDate: null,
      cycleLength: null,
      peakDay: null,
      temperatureShiftDay: null,
      nadirDate: null,
      averageLowTemperature: null,
      estimatedOvulationDate: null,
      confirmedInfertileFrom: null,
      lutealLength: null,
      isUncertain: false,
    };
    buildDailyInsights({
      cycle: phantomCycle,
      analysis: phantomAnalysis,
      entriesByDate,
      shortestCycle: effectiveShortest,
      averageCycle,
      averageLuteal,
      projectionEnd: addDays(phantomStart, averageCycle - 1),
      today,
      output: statusByDate,
    });
    phantomStart = addDays(phantomStart, averageCycle);
  }

  return {
    statusByDate,
    analyses,
    averageCycleLength: averageCycle,
    averageLutealLength: averageLuteal,
    shortestCycleLength: shortestCycle,
    cyclesUsedForLuteal: lutealHistory.length,
  };
}

// ───────── Análisis individual de un ciclo ─────────

function analyzeCycle(
  cycle: CycleSpan,
  entriesByDate: Record<ISODate, DayEntry>,
  averageCycle: number,
  today: ISODate
): CycleAnalysis {
  const effectiveEnd = cycle.endIfClosed ?? today;
  const cycleLength =
    cycle.endIfClosed != null
      ? daysBetween(cycle.start, cycle.endIfClosed) + 1
      : null;

  // Día Pico = último día con moco máximo.
  const peakDay =
    rangeInclusive(cycle.start, effectiveEnd)
      .map((d) => entriesByDate[d])
      .filter((e): e is DayEntry => !!e && mucusIsPeak(e.cervicalMucus))
      .map((e) => e.date)
      .sort()
      .pop() ?? null;

  // Salto térmico.
  const tempShift = detectTemperatureShift(cycle.start, effectiveEnd, entriesByDate);

  // Nadir = mínima en los días previos al salto térmico.
  let nadir: ISODate | null = null;
  if (tempShift) {
    const window = rangeInclusive(addDays(tempShift.day, -8), addDays(tempShift.day, -1));
    const candidates = window
      .map((d) => entriesByDate[d])
      .filter((e): e is DayEntry => !!e && e.basalTemperature != null);
    if (candidates.length) {
      nadir = candidates.reduce((min, e) =>
        (e.basalTemperature as number) < (min.basalTemperature as number) ? e : min
      ).date;
    }
  }

  // Ovulación estimada: día anterior al salto térmico, o Día Pico.
  const ovulation = tempShift ? addDays(tempShift.day, -2) : peakDay;

  // Doble control.
  const mucusCloseDay = peakDay ? addDays(peakDay, 3) : null;
  const tempCloseDay = tempShift ? tempShift.day : null;
  const confirmedInfertileFrom =
    mucusCloseDay != null && tempCloseDay != null
      ? addDays(maxDate(mucusCloseDay, tempCloseDay), 1)
      : null;

  // Fase lútea.
  const luteal =
    cycle.endIfClosed != null && ovulation != null
      ? daysBetween(ovulation, cycle.endIfClosed)
      : null;

  const isUncertain =
    cycleLength != null &&
    Math.abs(cycleLength - averageCycle) / averageCycle > 0.2;

  return {
    cycleStartDate: cycle.start,
    cycleEndDate: cycle.endIfClosed,
    cycleLength,
    peakDay,
    temperatureShiftDay: tempShift ? tempShift.day : null,
    nadirDate: nadir,
    averageLowTemperature: tempShift ? tempShift.lowAverage : null,
    estimatedOvulationDate: ovulation,
    confirmedInfertileFrom,
    lutealLength: luteal,
    isUncertain,
  };
}

/**
 * Recorre cada ventana posible. Para cada día candidato i (≥ 6º tras el inicio):
 *   - lowSix = temps de los 6 días previos.
 *   - rise = i, i+1, i+2 → cada uno ≥ media(lowSix) + 0.1; i+2 ≥ media + 0.2.
 */
function detectTemperatureShift(
  cycleStart: ISODate,
  cycleEnd: ISODate,
  entriesByDate: Record<ISODate, DayEntry>
): TempShift | null {
  const days = rangeInclusive(cycleStart, cycleEnd);
  if (days.length < 9) return null;

  for (let firstHighIdx = 6; firstHighIdx < days.length - 2; firstHighIdx++) {
    const lowSix: number[] = [];
    for (let i = firstHighIdx - 6; i < firstHighIdx; i++) {
      const t = entriesByDate[days[i]]?.basalTemperature;
      if (t != null) lowSix.push(t);
    }
    if (lowSix.length < 6) continue;

    const highs: number[] = [];
    for (let i = firstHighIdx; i <= firstHighIdx + 2; i++) {
      const t = entriesByDate[days[i]]?.basalTemperature;
      if (t != null) highs.push(t);
    }
    if (highs.length < 3) continue;

    const mean = average(lowSix);
    const allUp = highs.every((t) => t >= mean + 0.1 - 1e-9);
    const thirdUp = highs[2] >= mean + 0.2 - 1e-9;
    if (allUp && thirdUp) {
      return { day: days[firstHighIdx + 2], lowAverage: mean };
    }
  }
  return null;
}

// ───────── Mapeo día → DayInsight ─────────

interface BuildParams {
  cycle: CycleSpan;
  analysis: CycleAnalysis;
  entriesByDate: Record<ISODate, DayEntry>;
  shortestCycle: number;
  averageCycle: number;
  averageLuteal: number;
  projectionEnd: ISODate | null;
  today: ISODate;
  output: Record<ISODate, DayInsight>;
}

function buildDailyInsights(p: BuildParams): void {
  const { cycle, analysis, entriesByDate, shortestCycle, averageCycle, averageLuteal, output } = p;
  const end = p.projectionEnd ?? cycle.endIfClosed ?? p.today;
  const doringOpenDay = addDays(cycle.start, Math.max(shortestCycle - 20 - 1, 0));

  const projectedOvulation =
    analysis.estimatedOvulationDate ??
    addDays(cycle.start, averageCycle - averageLuteal - 1);
  const projectedFertileStart = addDays(projectedOvulation, -5);

  for (const d of rangeInclusive(cycle.start, end)) {
    const entry = entriesByDate[d];
    const cycleDay = daysBetween(cycle.start, d) + 1;
    const flow = entry?.menstruationFlow ?? "NONE";
    const isMenstruation = flow !== "NONE" && cycleDay <= 7;

    const isPeak = analysis.peakDay === d;
    const isOvulation = analysis.estimatedOvulationDate === d;
    const isShift = analysis.temperatureShiftDay === d;
    const isNadir = analysis.nadirDate === d;

    let status: FertilityStatus;
    let explanation: string;

    if (isMenstruation) {
      status = "MENSTRUATION";
      explanation = "Día de menstruación";
    } else if (analysis.confirmedInfertileFrom != null && d >= analysis.confirmedInfertileFrom) {
      status = "INFERTILE";
      explanation = "Fase lútea confirmada (doble control: temperatura + moco)";
    } else if (
      analysis.peakDay != null &&
      d >= analysis.peakDay &&
      d <= addDays(analysis.peakDay, 3)
    ) {
      status = "PEAK";
      explanation = isPeak
        ? "Día Pico (último moco máximo)"
        : `Fertilidad máxima — ${daysBetween(analysis.peakDay, d)} día(s) tras el Día Pico`;
    } else if (entry != null && mucusIsFertile(entry.cervicalMucus)) {
      status = mucusIsPeak(entry.cervicalMucus) ? "PEAK" : "FERTILE";
      explanation = `Moco fértil registrado: ${MUCUS_META[entry.cervicalMucus].label}`;
    } else if (d < doringOpenDay) {
      status = "INFERTILE";
      explanation = "Antes de la apertura de Döring (ciclo más corto −20)";
    } else if (analysis.isUncertain) {
      status = "UNCERTAIN";
      explanation = "Ciclo irregular: confíe solo en biomarcadores";
    } else if (analysis.peakDay == null && d === projectedOvulation) {
      status = "PEAK";
      explanation = "Día de ovulación estimado por algoritmo dinámico";
    } else if (d >= projectedFertileStart && d <= addDays(projectedOvulation, 1)) {
      status = "FERTILE";
      explanation = "Ventana fértil estimada (sin confirmación aún)";
    } else {
      status = "INFERTILE";
      explanation = "Fuera de la ventana fértil estimada";
    }

    output[d] = {
      date: d,
      status,
      cycleDay,
      isMenstruation,
      isPeakDay: isPeak,
      isOvulationEstimate: isOvulation,
      isTemperatureShiftDay: isShift,
      isNadir,
      isUncertain: analysis.isUncertain,
      explanation,
    };
  }
}
