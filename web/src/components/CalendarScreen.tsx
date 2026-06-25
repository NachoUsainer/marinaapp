"use client";

import { useMemo } from "react";
import {
  IosGroupedSection,
  IosLargeTitle,
  IosListRow,
  StatusPill,
} from "./ios";
import { FertilityStore } from "@/data/store";
import {
  DayInsight,
  FertilityStatus,
  STATUS_PALETTE,
} from "@/domain/types";
import { addDays, formatLong, ISODate, monthTitle, todayISO } from "@/lib/date";

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

const LEGEND: { status: FertilityStatus; name: string }[] = [
  { status: "MENSTRUATION", name: "Menstruación" },
  { status: "INFERTILE", name: "Fertilidad baja" },
  { status: "FERTILE", name: "Fertilidad alta" },
  { status: "PEAK", name: "Fertilidad máxima" },
  { status: "UNCERTAIN", name: "Datos inciertos" },
];

export function CalendarScreen({
  store,
  month,
  selectedDate,
  onSelectDate,
  onShowMonth,
}: {
  store: FertilityStore;
  month: { year: number; month: number }; // month: 1-12
  selectedDate: ISODate;
  onSelectDate: (d: ISODate) => void;
  onShowMonth: (m: { year: number; month: number }) => void;
}) {
  const insights = store.result.statusByDate;
  const today = todayISO();
  const insight = insights[selectedDate];

  const grid = useMemo(() => buildGrid(month.year, month.month), [month]);

  const prevMonth = () => {
    const m = month.month === 1 ? 12 : month.month - 1;
    const y = month.month === 1 ? month.year - 1 : month.year;
    onShowMonth({ year: y, month: m });
  };
  const nextMonth = () => {
    const m = month.month === 12 ? 1 : month.month + 1;
    const y = month.month === 12 ? month.year + 1 : month.year;
    onShowMonth({ year: y, month: m });
  };

  return (
    <div className="pb-6">
      <IosLargeTitle>Calendario</IosLargeTitle>

      <IosGroupedSection>
        {/* Cabecera del mes */}
        <div className="flex items-center justify-between px-3 py-2">
          <span className="pl-2 text-lg font-semibold">
            {monthTitle(month.year, month.month)}
          </span>
          <div className="flex">
            <button
              onClick={prevMonth}
              aria-label="Mes anterior"
              className="px-3 py-1 text-2xl leading-none text-brand-rose"
            >
              ‹
            </button>
            <button
              onClick={nextMonth}
              aria-label="Mes siguiente"
              className="px-3 py-1 text-2xl leading-none text-brand-rose"
            >
              ›
            </button>
          </div>
        </div>

        {/* Etiquetas de día */}
        <div className="flex px-2 pb-1">
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              className="flex-1 text-center text-xs font-semibold text-ios-secondary"
            >
              {w}
            </div>
          ))}
        </div>

        {/* Rejilla */}
        <div className="px-2 pb-3">
          {grid.map((week, wi) => (
            <div key={wi} className="flex">
              {week.map((date, di) => (
                <div key={di} className="flex aspect-square flex-1 items-center justify-center">
                  {date && (
                    <DayCell
                      date={date}
                      dayNum={Number(date.slice(8, 10))}
                      isToday={date === today}
                      isSelected={date === selectedDate}
                      insight={insights[date]}
                      onClick={() => onSelectDate(date)}
                    />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </IosGroupedSection>

      <div className="h-2" />

      {/* Día seleccionado */}
      <IosGroupedSection title="Día seleccionado">
        <IosListRow showDivider={!!insight}>
          <div className="flex-1">
            <div className="text-lg font-semibold">{formatLong(selectedDate)}</div>
            {insight?.cycleDay != null && (
              <div className="text-xs text-ios-secondary">
                Día {insight.cycleDay} del ciclo
              </div>
            )}
          </div>
          {insight && <StatusPill status={insight.status} />}
        </IosListRow>
        {insight && (
          <IosListRow showDivider={false}>
            <span className="text-sm text-ios-label">{insight.explanation}</span>
          </IosListRow>
        )}
      </IosGroupedSection>

      <div className="h-2" />

      {/* Resumen del ciclo */}
      <IosGroupedSection
        title="Ciclo"
        footer="Calculado por método sintotérmico (Sensiplan): doble control temperatura + moco."
      >
        <SummaryRow label="Longitud media" value={`${store.result.averageCycleLength} días`} />
        <SummaryRow
          label="Fase lútea media"
          value={
            store.result.cyclesUsedForLuteal > 0
              ? `${store.result.averageLutealLength} días · ${store.result.cyclesUsedForLuteal} ciclos`
              : `${store.result.averageLutealLength} días (sin histórico)`
          }
        />
        <SummaryRow
          label="Próxima ovulación"
          value={store.nextOvulation ? formatLong(store.nextOvulation) : "—"}
        />
        <SummaryRow
          label="Próxima menstruación"
          value={store.nextPeriod ? formatLong(store.nextPeriod) : "—"}
          last
        />
      </IosGroupedSection>

      <div className="h-2" />

      {/* Leyenda */}
      <IosGroupedSection title="Leyenda">
        {LEGEND.map((l, i) => {
          const pal = STATUS_PALETTE[l.status];
          return (
            <IosListRow key={l.status} showDivider={i < LEGEND.length - 1}>
              <span
                className="h-5 w-5 rounded-full"
                style={{ backgroundColor: pal.bg }}
              />
              <span className="ml-3 flex-1 text-sm text-ios-label">{l.name}</span>
              <span className="text-xs font-semibold" style={{ color: pal.fg }}>
                {pal.label}
              </span>
            </IosListRow>
          );
        })}
      </IosGroupedSection>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <IosListRow showDivider={!last}>
      <span className="flex-1 text-sm text-ios-label">{label}</span>
      <span className="text-sm text-ios-secondary">{value}</span>
    </IosListRow>
  );
}

function DayCell({
  date,
  dayNum,
  isToday,
  isSelected,
  insight,
  onClick,
}: {
  date: ISODate;
  dayNum: number;
  isToday: boolean;
  isSelected: boolean;
  insight?: DayInsight;
  onClick: () => void;
}) {
  const pal = insight ? STATUS_PALETTE[insight.status] : null;
  const ring = isSelected
    ? "ring-2 ring-brand-rose"
    : isToday
    ? "ring-[1.5px] ring-brand-rose"
    : "";

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center"
      aria-label={`${date}${insight ? `, ${STATUS_PALETTE[insight.status].label}` : ""}`}
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm ${ring} ${
          isToday ? "font-bold" : "font-medium"
        }`}
        style={{
          backgroundColor: pal?.bg ?? "transparent",
          color: pal?.fg ?? "#1c1c1e",
        }}
      >
        {dayNum}
      </span>
      <span className="mt-0.5 flex h-1.5 gap-0.5">
        {insight?.isPeakDay && <Dot color="#FF375F" />}
        {insight?.isTemperatureShiftDay && <Dot color="#007AFF" />}
        {insight?.isLhSurge && <Dot color="#00897B" />}
        {insight?.isOvulationEstimate && !insight.isPeakDay && <Dot color="#AF52DE" />}
      </span>
    </button>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span
      className="h-1 w-1 rounded-full"
      style={{ backgroundColor: color }}
      aria-hidden
    />
  );
}

/** Construye una matriz [semana][díaDeSemana] de fechas ISO (lunes primero). */
function buildGrid(year: number, month1: number): (ISODate | null)[][] {
  const first = `${year}-${String(month1).padStart(2, "0")}-01`;
  const firstWeekday = new Date(`${first}T00:00:00`).getDay(); // 0=domingo
  const leadingBlanks = (firstWeekday - 1 + 7) % 7; // lunes=0
  const daysInMonth = new Date(year, month1, 0).getDate();

  const cells: (ISODate | null)[] = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push(null);
  for (let d = 0; d < daysInMonth; d++) cells.push(addDays(first, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (ISODate | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
