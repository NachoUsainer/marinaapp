// Utilidades sobre fechas ISO ("YYYY-MM-DD").
// La comparación lexicográfica de strings ISO coincide con el orden cronológico,
// así que `<`, `>`, `===` funcionan directamente como comparadores de fecha.

export type ISODate = string;

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** Fecha de hoy en zona horaria local, como ISO. */
export function todayISO(): ISODate {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Suma (o resta, con n negativo) días. Aritmética en UTC para evitar saltos de DST. */
export function addDays(iso: ISODate, n: number): ISODate {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Días enteros entre dos fechas (b - a). */
export function daysBetween(a: ISODate, b: ISODate): number {
  const da = Date.parse(`${a}T00:00:00Z`);
  const db = Date.parse(`${b}T00:00:00Z`);
  return Math.round((db - da) / 86_400_000);
}

export function minDate(a: ISODate, b: ISODate): ISODate {
  return a < b ? a : b;
}

export function maxDate(a: ISODate, b: ISODate): ISODate {
  return a > b ? a : b;
}

/** Rango inclusivo [from, to] como lista de fechas ISO. */
export function rangeInclusive(from: ISODate, to: ISODate): ISODate[] {
  const out: ISODate[] = [];
  let d = from;
  while (d <= to) {
    out.push(d);
    d = addDays(d, 1);
  }
  return out;
}

// ───────── Formato para UI (locale español) ─────────

export function formatLong(iso: ISODate): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${iso}T00:00:00`));
}

export function formatWeekdayLong(iso: ISODate): string {
  const s = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${iso}T00:00:00`));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function monthTitle(year: number, month1: number): string {
  const s = new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month1 - 1, 1));
  return s.charAt(0).toUpperCase() + s.slice(1);
}
