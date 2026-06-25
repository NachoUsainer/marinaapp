import { describe, expect, it } from "vitest";
import { analyze, computeInfertileStart } from "./fertilityEngine";
import { CycleAnalysis, DayEntry, emptyEntry } from "./types";
import { addDays, ISODate } from "@/lib/date";

const START = "2026-01-01";

/**
 * Construye un ciclo: 6 bajas (días 1-6) + N altas, inicio marcado el día 1.
 * `overrides` fusiona observaciones extra (moco, flujo…) por offset de día,
 * conservando las temperaturas ya asignadas.
 */
function cycle(
  lows: number[],
  highs: number[],
  overrides: Record<number, Partial<DayEntry>> = {}
): DayEntry[] {
  const temps = [...lows, ...highs];
  const overrideKeys = Object.keys(overrides).map(Number);
  const total = Math.max(temps.length, ...overrideKeys.map((n) => n + 1), 1);

  const arr: DayEntry[] = [];
  for (let i = 0; i < total; i++) {
    const base: Partial<DayEntry> = {};
    if (i < temps.length) base.basalTemperature = temps[i];
    if (i === 0) {
      base.isCycleStart = true;
      base.menstruationFlow = "HEAVY";
    }
    arr.push({ ...emptyEntry(addDays(START, i)), ...base, ...(overrides[i] ?? {}) });
  }
  return arr;
}

function run(entries: DayEntry[], today = addDays(START, 25)) {
  return analyze({ cycleStarts: [START], entries, today });
}

describe("Hallazgo 1 — coverline = máximo de las 6 (no la media)", () => {
  const lows = [36.2, 36.2, 36.2, 36.2, 36.2, 36.7]; // media≈36.28, máximo=36.70

  it("NO confirma un salto que solo supera la media pero no la coverline", () => {
    // 36.5/36.55/36.6: con la regla antigua (media+0.1/+0.2) confirmaría;
    // con la coverline (36.70) ninguna supera el máximo → sin salto.
    const a = run(cycle(lows, [36.5, 36.55, 36.6])).analyses[0];
    expect(a.temperatureShiftDay).toBeNull();
  });

  it("SÍ confirma cuando las 3 superan la coverline y la 3ª está +0.2", () => {
    const a = run(cycle(lows, [36.75, 36.8, 36.95])).analyses[0];
    expect(a.coverlineTemperature).toBeCloseTo(36.7, 5);
    expect(a.temperatureShiftDay).toBe(addDays(START, 8)); // día 9 (3ª alta)
    expect(a.firstHigherMeasurementDate).toBe(addDays(START, 6)); // día 7
  });
});

describe("Hallazgo 2 — excepción de la 4ª medición", () => {
  const lows = [36.4, 36.38, 36.4, 36.39, 36.4, 36.4]; // coverline=36.40

  it("confirma en la 4ª cuando la 3ª no llega a +0.2 pero hay una 4ª por encima", () => {
    // altas todas por encima de 36.40 pero <36.60 (no +0.2): se exige la 4ª.
    const a = run(cycle(lows, [36.55, 36.55, 36.55, 36.55])).analyses[0];
    expect(a.temperatureShiftDay).toBe(addDays(START, 9)); // día 10 (4ª alta)
  });

  it("sin 4ª medición válida no confirma", () => {
    const a = run(cycle(lows, [36.55, 36.55, 36.55])).analyses[0];
    expect(a.temperatureShiftDay).toBeNull();
  });
});

describe("Hallazgo 4 — Día Pico = mejor moco fértil, no solo clara de huevo", () => {
  const flat = [36.4, 36.4, 36.4, 36.4, 36.4, 36.4];
  const rise = [36.7, 36.75, 36.9];

  it("usa el último día acuoso (S+) cuando no hay clara de huevo", () => {
    const a = run(
      cycle(flat, rise, {
        8: { cervicalMucus: "CREAMY" },
        9: { cervicalMucus: "WATERY" },
        10: { cervicalMucus: "WATERY" },
        11: { cervicalMucus: "CREAMY" },
      })
    ).analyses[0];
    expect(a.peakDay).toBe(addDays(START, 10)); // último WATERY (mejor calidad)
  });

  it("prefiere la clara de huevo cuando existe", () => {
    const a = run(
      cycle(flat, rise, {
        8: { cervicalMucus: "WATERY" },
        9: { cervicalMucus: "EGG_WHITE" },
        10: { cervicalMucus: "WATERY" },
      })
    ).analyses[0];
    expect(a.peakDay).toBe(addDays(START, 9));
  });

  it("no marca Pico si el moco nunca llega a fértil (S+)", () => {
    const a = run(cycle(flat, rise, { 8: { cervicalMucus: "STICKY" } })).analyses[0];
    expect(a.peakDay).toBeNull();
  });
});

describe("Hallazgo 3 — regla menos-8 / 5 días", () => {
  function priorWithFhm(fhmCycleDay: number): CycleAnalysis {
    return {
      cycleStartDate: "2025-01-01",
      cycleEndDate: null,
      cycleLength: null,
      peakDay: null,
      temperatureShiftDay: null,
      firstHigherMeasurementDate: addDays("2025-01-01", fhmCycleDay - 1),
      nadirDate: null,
      averageLowTemperature: null,
      coverlineTemperature: null,
      estimatedOvulationDate: null,
      confirmedInfertileFrom: null,
      lutealLength: null,
      isUncertain: false,
    };
  }

  it("sin histórico térmico usa el respaldo de calendario (más corto − 20)", () => {
    expect(computeInfertileStart(START, [], 28)).toBe(addDays(START, 8));
  });

  it("con <12 ciclos limita a la regla de los 5 días", () => {
    // FHM más temprano día 12 → menos-8 = 4 → min(5,4) = 4.
    expect(computeInfertileStart(START, [priorWithFhm(12)], 28)).toBe(addDays(START, 4));
    // FHM día 20 → menos-8 = 12, pero limitado a 5.
    expect(computeInfertileStart(START, [priorWithFhm(20)], 28)).toBe(addDays(START, 5));
  });

  it("con ≥12 ciclos aplica menos-8 sin el límite de 5 días", () => {
    const priors = Array.from({ length: 12 }, () => priorWithFhm(18));
    // earliest FHM 18 → menos-8 = 10.
    expect(computeInfertileStart(START, priors, 28)).toBe(addDays(START, 10));
  });

  it("toma el FHM MÁS TEMPRANO del histórico", () => {
    const priors = [priorWithFhm(16), priorWithFhm(13), priorWithFhm(19)];
    // earliest 13 → menos-8 = 5 → min(5,5)=5.
    expect(computeInfertileStart(START, priors, 28)).toBe(addDays(START, 5));
  });

  it("nunca devuelve un día anterior al inicio del ciclo", () => {
    expect(computeInfertileStart(START, [priorWithFhm(6)], 28)).toBe(START);
  });
});

describe("Opción C — test de LH (ovulación)", () => {
  const flat = [36.4, 36.4, 36.4, 36.4, 36.4, 36.4];
  const rise = [36.7, 36.75, 36.9];

  it("estima la ovulación a partir del LH cuando no hay salto térmico", () => {
    // Sin subida térmica (temps planas); LH positivo el día (offset) 12.
    const a = run(cycle(flat, [36.4, 36.4, 36.4], { 12: { lhTest: "POSITIVE" } }))
      .analyses[0];
    expect(a.temperatureShiftDay).toBeNull();
    expect(a.lhSurgeDate).toBe(addDays(START, 12));
    expect(a.estimatedOvulationDate).toBe(addDays(START, 13)); // pico LH + 1
  });

  it("la temperatura tiene prioridad sobre el LH si discrepan", () => {
    const a = run(cycle(flat, rise, { 14: { lhTest: "POSITIVE" } })).analyses[0];
    expect(a.temperatureShiftDay).toBe(addDays(START, 8));
    expect(a.estimatedOvulationDate).toBe(addDays(START, 6)); // salto − 2, no LH + 1
  });

  it("el LH NO confirma por sí solo la fase infértil (doble control intacto)", () => {
    // Salto térmico + LH positivo, pero SIN moco pico → no hay confirmación.
    const a = run(cycle(flat, rise, { 5: { lhTest: "POSITIVE" } })).analyses[0];
    expect(a.confirmedInfertileFrom).toBeNull();
  });

  it("toma el PRIMER positivo como pico de LH", () => {
    const a = run(
      cycle(flat, [36.4, 36.4, 36.4], {
        11: { lhTest: "POSITIVE" },
        12: { lhTest: "POSITIVE" },
      })
    ).analyses[0];
    expect(a.lhSurgeDate).toBe(addDays(START, 11));
  });
});

describe("Integración — ciclo realista", () => {
  const lows = [36.4, 36.42, 36.38, 36.41, 36.39, 36.43];
  const entries = cycle(lows, [36.6, 36.62, 36.7], {
    1: { menstruationFlow: "MEDIUM" },
    2: { menstruationFlow: "LIGHT" },
    5: { cervicalMucus: "EGG_WHITE" }, // Día Pico el día 6
  });
  const result = run(entries);
  const a = result.analyses[0];

  it("detecta Pico, salto y ovulación", () => {
    expect(a.peakDay).toBe(addDays(START, 5));
    expect(a.temperatureShiftDay).toBe(addDays(START, 8));
    expect(a.estimatedOvulationDate).toBe(addDays(START, 6)); // salto − 2
  });

  it("doble control: infértil desde el día siguiente al más tardío", () => {
    // max(Pico+3 = día6+3 = día9, salto = día9) + 1 = día10
    expect(a.confirmedInfertileFrom).toBe(addDays(START, 9));
    expect(result.statusByDate[addDays(START, 10)].status).toBe("INFERTILE");
  });

  it("genera predicción de ciclos futuros", () => {
    expect(result.statusByDate[addDays(START, 28)]).toBeDefined();
  });
});

describe("Robustez y coherencia", () => {
  it("ignora un ciclo implausiblemente corto al promediar", () => {
    // Dos inicios a 15 días: ese 'ciclo' de 15 días no debe fijar la media en 15.
    const entries: DayEntry[] = [
      { ...emptyEntry(START), isCycleStart: true, menstruationFlow: "HEAVY" },
      { ...emptyEntry(addDays(START, 15)), isCycleStart: true, menstruationFlow: "HEAVY" },
    ];
    const r = analyze({
      cycleStarts: [START, addDays(START, 15)],
      entries,
      today: addDays(START, 16),
    });
    expect(r.averageCycleLength).toBe(28); // por defecto, no 15
  });

  it("no pinta días futuros con biomarcadores registrados por adelantado", () => {
    // Hoy = START. Moco clara de huevo registrado 2 días en el futuro.
    const entries: DayEntry[] = [
      { ...emptyEntry(START), isCycleStart: true, menstruationFlow: "HEAVY" },
      { ...emptyEntry(addDays(START, 2)), cervicalMucus: "EGG_WHITE" },
    ];
    const r = analyze({ cycleStarts: [START], entries, today: START });
    // El día +2 (futuro) NO sale como fértil/pico por el moco adelantado.
    expect(r.statusByDate[addDays(START, 2)].status).not.toBe("PEAK");
    expect(r.statusByDate[addDays(START, 2)].status).not.toBe("FERTILE");
    // Y la ovulación del ciclo activo no se fija por ese moco futuro.
    expect(r.analyses[0].peakDay).toBeNull();
  });

  it("sí usa los biomarcadores de hoy y del pasado", () => {
    // Moco clara de huevo HOY debe contar.
    const entries: DayEntry[] = [
      { ...emptyEntry(addDays(START, -4)), isCycleStart: true },
      { ...emptyEntry(START), cervicalMucus: "EGG_WHITE" },
    ];
    const r = analyze({ cycleStarts: [addDays(START, -4)], entries, today: START });
    expect(r.statusByDate[START].status).toBe("PEAK");
  });

  it("la ovulación prevista coincide con lo que pinta el calendario", () => {
    const r = analyze({
      cycleStarts: [START],
      entries: [{ ...emptyEntry(START), isCycleStart: true }],
      today: START,
    });
    expect(r.predictedOvulation).not.toBeNull();
    expect(r.predictedOvulation! >= START).toBe(true);
    // El día previsto de ovulación está pintado como fertilidad máxima.
    expect(r.statusByDate[r.predictedOvulation!].status).toBe("PEAK");
  });
});

describe("Casos límite", () => {
  it("sin datos devuelve resultado vacío con valores por defecto", () => {
    const r = analyze({ cycleStarts: [], entries: [], today: START });
    expect(r.analyses).toHaveLength(0);
    expect(r.averageCycleLength).toBe(28);
  });

  it("ignora moco/flujo no fértil sin romperse", () => {
    const r = run([
      { ...emptyEntry(START), isCycleStart: true, menstruationFlow: "HEAVY" },
    ]);
    expect(r.analyses).toHaveLength(1);
    expect(r.analyses[0].temperatureShiftDay).toBeNull();
  });
});
