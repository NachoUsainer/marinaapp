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
  /** Día en que se CONFIRMA el salto (3ª medición elevada, o 4ª con la excepción). */
  day: ISODate;
  /** Día de la 1ª medición elevada (FHM). */
  firstHighDay: ISODate;
  lowAverage: number;
  /** Coverline = la más alta de las 6 temperaturas bajas previas. */
  coverline: number;
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
    // Inicio de fase infértil para ESTE ciclo según el histórico previo (menos-8).
    const doringOpenDay = computeInfertileStart(
      cycles[idx].start,
      analyses.slice(0, idx),
      effectiveShortest
    );
    buildDailyInsights({
      cycle: cycles[idx],
      analysis,
      entriesByDate,
      doringOpenDay,
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
      lhSurgeDate: null,
      firstHigherMeasurementDate: null,
      nadirDate: null,
      averageLowTemperature: null,
      coverlineTemperature: null,
      estimatedOvulationDate: null,
      confirmedInfertileFrom: null,
      lutealLength: null,
      isUncertain: false,
    };
    buildDailyInsights({
      cycle: phantomCycle,
      analysis: phantomAnalysis,
      entriesByDate,
      doringOpenDay: computeInfertileStart(phantomStart, analyses, effectiveShortest),
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

  // Día Pico = último día con la MEJOR calidad de moco fértil del ciclo (Sensiplan).
  // No exige clara de huevo: si el máximo observado es S+ (acuoso/cremoso), el Pico
  // es el último día con ese nivel máximo. Solo cuenta si el máximo es fértil (≥ S+).
  const cycleMucus = rangeInclusive(cycle.start, effectiveEnd)
    .map((d) => entriesByDate[d])
    .filter((e): e is DayEntry => !!e && mucusIsFertile(e.cervicalMucus));
  const maxMucusScore = cycleMucus.reduce(
    (max, e) => Math.max(max, MUCUS_META[e.cervicalMucus].score),
    0
  );
  const peakDay =
    cycleMucus.length > 0
      ? cycleMucus
          .filter((e) => MUCUS_META[e.cervicalMucus].score === maxMucusScore)
          .map((e) => e.date)
          .sort()
          .pop() ?? null
      : null;

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

  // Pico de LH = primer test positivo del ciclo. La ovulación ocurre ~1 día después.
  const lhSurgeDate =
    rangeInclusive(cycle.start, effectiveEnd)
      .map((d) => entriesByDate[d])
      .filter((e): e is DayEntry => !!e && (e.lhTest ?? "NONE") === "POSITIVE")
      .map((e) => e.date)
      .sort()[0] ?? null;
  const ovulationFromLh = lhSurgeDate ? addDays(lhSurgeDate, 1) : null;

  // Ovulación estimada — precedencia: temperatura (retrospectiva, fiable) >
  // LH (predictiva) > Día Pico del moco.
  const ovulation = tempShift
    ? addDays(tempShift.day, -2)
    : ovulationFromLh ?? peakDay;

  // Doble control (regla de seguridad). Se confirma SOLO con temperatura + moco.
  // El LH NO se incluye a propósito: un positivo predice la ovulación pero no
  // confirma que ya haya terminado, así que no debe acortar la fase fértil.
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
    lhSurgeDate,
    firstHigherMeasurementDate: tempShift ? tempShift.firstHighDay : null,
    nadirDate: nadir,
    averageLowTemperature: tempShift ? tempShift.lowAverage : null,
    coverlineTemperature: tempShift ? tempShift.coverline : null,
    estimatedOvulationDate: ovulation,
    confirmedInfertileFrom,
    lutealLength: luteal,
    isUncertain,
  };
}

/**
 * Regla de temperatura de Sensiplan (3 sobre 6), con coverline y excepción.
 *
 * Para cada día candidato i (≥ 6º tras el inicio):
 *   - lowSix = temps de los 6 días previos. Coverline = MÁXIMO de esas 6.
 *   - Las 3 mediciones (i, i+1, i+2) deben estar por encima de la coverline.
 *   - Regla normal: la 3ª debe estar ≥ coverline + 0.2 °C → confirma en i+2.
 *   - Excepción: si la 3ª está por encima pero < +0.2 °C, se requiere una 4ª
 *     medición por encima de la coverline → confirma en i+3.
 */
function detectTemperatureShift(
  cycleStart: ISODate,
  cycleEnd: ISODate,
  entriesByDate: Record<ISODate, DayEntry>
): TempShift | null {
  const days = rangeInclusive(cycleStart, cycleEnd);
  if (days.length < 9) return null;

  const tempAt = (i: number): number | null =>
    i < days.length ? entriesByDate[days[i]]?.basalTemperature ?? null : null;

  for (let firstHighIdx = 6; firstHighIdx < days.length - 2; firstHighIdx++) {
    const lowSix: number[] = [];
    for (let i = firstHighIdx - 6; i < firstHighIdx; i++) {
      const t = tempAt(i);
      if (t != null) lowSix.push(t);
    }
    if (lowSix.length < 6) continue;

    const coverline = Math.max(...lowSix);
    const mean = average(lowSix);

    const t0 = tempAt(firstHighIdx);
    const t1 = tempAt(firstHighIdx + 1);
    const t2 = tempAt(firstHighIdx + 2);
    if (t0 == null || t1 == null || t2 == null) continue;

    // Las dos primeras deben superar la coverline; si no, no es esta ventana.
    if (!(t0 > coverline && t1 > coverline && t2 > coverline)) continue;

    const base = { firstHighDay: days[firstHighIdx], lowAverage: mean, coverline };

    // Regla normal: 3ª medición ≥ coverline + 0.2 °C.
    if (t2 >= coverline + 0.2 - 1e-9) {
      return { day: days[firstHighIdx + 2], ...base };
    }

    // Excepción: 3ª por encima pero < +0.2 → se necesita una 4ª por encima.
    const t3 = tempAt(firstHighIdx + 3);
    if (t3 != null && t3 > coverline) {
      return { day: days[firstHighIdx + 3], ...base };
    }
    // Si no, continúa buscando otra ventana válida.
  }
  return null;
}

// ───────── Mapeo día → DayInsight ─────────

/**
 * Primer día fértil al inicio del ciclo (fin de la fase infértil preovulatoria).
 *
 * Regla menos-8 de Sensiplan: con histórico de saltos térmicos confirmados,
 *   último día infértil = (FHM más temprano observado) − 8.
 *   - Con ≥ 12 ciclos confirmados se aplica directamente.
 *   - Con menos, se limita a la "regla de los 5 días" (máx. día 5), y solo si
 *     existe al menos un ciclo previo con salto confirmado.
 * Sin histórico térmico: estimación de calendario (Döring, ciclo más corto − 20).
 *
 * Devuelve la FECHA del primer día fértil (los días anteriores son infértiles).
 */
export function computeInfertileStart(
  cycleStart: ISODate,
  priorAnalyses: CycleAnalysis[],
  effectiveShortest: number
): ISODate {
  const fhmCycleDays = priorAnalyses
    .filter((a) => a.firstHigherMeasurementDate != null)
    .map((a) => daysBetween(a.cycleStartDate, a.firstHigherMeasurementDate as ISODate) + 1);

  let lastInfertileDay: number;
  if (fhmCycleDays.length >= 1) {
    const earliestFhm = Math.min(...fhmCycleDays);
    const minus8 = earliestFhm - 8;
    lastInfertileDay = fhmCycleDays.length >= 12 ? minus8 : Math.min(5, minus8);
  } else {
    // Sin datos de temperatura: respaldo de calendario.
    lastInfertileDay = effectiveShortest - 20;
  }
  lastInfertileDay = Math.max(lastInfertileDay, 0);
  return addDays(cycleStart, lastInfertileDay);
}

interface BuildParams {
  cycle: CycleSpan;
  analysis: CycleAnalysis;
  entriesByDate: Record<ISODate, DayEntry>;
  doringOpenDay: ISODate;
  averageCycle: number;
  averageLuteal: number;
  projectionEnd: ISODate | null;
  today: ISODate;
  output: Record<ISODate, DayInsight>;
}

function buildDailyInsights(p: BuildParams): void {
  const { cycle, analysis, entriesByDate, doringOpenDay, averageCycle, averageLuteal, output } = p;
  const end = p.projectionEnd ?? cycle.endIfClosed ?? p.today;

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
    const isLhSurge = analysis.lhSurgeDate === d;
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
      explanation = "Fase preovulatoria infértil (regla menos-8 / inicio de ciclo)";
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
      isLhSurge,
      isNadir,
      isUncertain: analysis.isUncertain,
      explanation,
    };
  }
}
