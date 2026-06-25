"use client";

import { useEffect, useState } from "react";
import { IosGroupedSection, IosLargeTitle, IosListRow } from "./ios";
import {
  CervicalMucus,
  DayEntry,
  emptyEntry,
  FLOW_LABEL,
  FLOW_ORDER,
  LH_LABEL,
  LH_ORDER,
  LhResult,
  MenstruationFlow,
  MUCUS_META,
  MUCUS_ORDER,
} from "@/domain/types";
import { addDays, formatLong, formatWeekdayLong, ISODate, todayISO } from "@/lib/date";

export function DailyLogScreen({
  selectedDate,
  entry,
  onSave,
  onClear,
  onSelectDate,
}: {
  selectedDate: ISODate;
  entry: DayEntry | undefined;
  onSave: (e: DayEntry) => void;
  onClear: () => void;
  onSelectDate: (d: ISODate) => void;
}) {
  const today = todayISO();
  const isToday = selectedDate === today;
  const [basalText, setBasalText] = useState("");
  const [mucus, setMucus] = useState<CervicalMucus>("NONE");
  const [flow, setFlow] = useState<MenstruationFlow>("NONE");
  const [lh, setLh] = useState<LhResult>("NONE");
  const [isStart, setIsStart] = useState(false);
  const [notes, setNotes] = useState("");
  const [savedAt, setSavedAt] = useState(0);

  // Recarga el formulario cuando cambia el día o su entrada.
  useEffect(() => {
    setBasalText(entry?.basalTemperature != null ? String(entry.basalTemperature) : "");
    setMucus(entry?.cervicalMucus ?? "NONE");
    setFlow(entry?.menstruationFlow ?? "NONE");
    setLh(entry?.lhTest ?? "NONE");
    setIsStart(entry?.isCycleStart ?? false);
    setNotes(entry?.notes ?? "");
  }, [entry, selectedDate]);

  const save = () => {
    const temp = parseFloat(basalText.replace(",", "."));
    const next: DayEntry = {
      ...emptyEntry(selectedDate),
      basalTemperature: Number.isFinite(temp) ? temp : null,
      cervicalMucus: mucus,
      menstruationFlow: flow,
      lhTest: lh,
      isCycleStart: isStart,
      notes: notes.trim(),
    };
    onSave(next);
    setSavedAt(Date.now());
    window.setTimeout(() => setSavedAt(0), 1500);
  };

  return (
    <div className="pb-6">
      <IosLargeTitle>Registro</IosLargeTitle>

      {/* Selector de día: flechas + toca la fecha para saltar a cualquier día */}
      <div className="mx-4 mb-2 flex items-center justify-between rounded-xl bg-ios-card px-2 py-2">
        <button
          aria-label="Día anterior"
          onClick={() => onSelectDate(addDays(selectedDate, -1))}
          className="px-3 text-2xl leading-none text-brand-rose"
        >
          ‹
        </button>
        <label className="relative flex flex-1 cursor-pointer flex-col items-center">
          <span className="text-base font-semibold text-ios-label">
            {isToday ? "Hoy" : formatWeekdayLong(selectedDate)}
          </span>
          <span className="text-xs text-ios-secondary">{formatLong(selectedDate)}</span>
          <input
            type="date"
            value={selectedDate}
            max={today}
            onChange={(e) => e.target.value && onSelectDate(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="Elegir fecha"
          />
        </label>
        <button
          aria-label="Día siguiente"
          disabled={selectedDate >= today}
          onClick={() => onSelectDate(addDays(selectedDate, 1))}
          className="px-3 text-2xl leading-none text-brand-rose disabled:opacity-30"
        >
          ›
        </button>
      </div>

      {!isToday && (
        <button
          onClick={() => onSelectDate(today)}
          className="mx-4 mb-2 text-sm font-medium text-brand-rose"
        >
          ← Volver a hoy
        </button>
      )}

      {/* Temperatura */}
      <IosGroupedSection
        title="Temperatura basal"
        footer="Tómate la temperatura al despertar, siempre a la misma hora."
      >
        <IosListRow showDivider={false}>
          <span className="mr-3 text-ios-secondary">°C</span>
          <input
            type="text"
            inputMode="decimal"
            value={basalText}
            onChange={(e) =>
              setBasalText(e.target.value.replace(/[^0-9.,]/g, ""))
            }
            placeholder="36.5"
            className="w-full rounded-lg border border-ios-sep px-3 py-2 outline-none focus:border-brand-rose"
          />
        </IosListRow>
      </IosGroupedSection>

      <div className="h-2" />

      {/* Moco */}
      <IosGroupedSection
        title="Moco cervical (Sensiplan)"
        footer={'El moco "clara de huevo" define el Día Pico.'}
      >
        {MUCUS_ORDER.map((opt, i) => (
          <IosListRow
            key={opt}
            showDivider={i < MUCUS_ORDER.length - 1}
            onClick={() => setMucus(opt)}
          >
            <div className="flex-1">
              <div className="text-base text-ios-label">{MUCUS_META[opt].label}</div>
              <div className="text-xs text-ios-secondary">{MUCUS_META[opt].hint}</div>
            </div>
            {mucus === opt && <Checkmark />}
          </IosListRow>
        ))}
      </IosGroupedSection>

      <div className="h-2" />

      {/* Sangrado */}
      <IosGroupedSection title="Sangrado">
        {FLOW_ORDER.map((opt, i) => (
          <IosListRow
            key={opt}
            showDivider={i < FLOW_ORDER.length - 1}
            onClick={() => setFlow(opt)}
          >
            <span className="flex-1 text-ios-label">{FLOW_LABEL[opt]}</span>
            {flow === opt && <Checkmark />}
          </IosListRow>
        ))}
      </IosGroupedSection>

      <div className="h-2" />

      {/* Test de ovulación (LH) */}
      <IosGroupedSection
        title="Test de ovulación (LH)"
        footer="Opcional. Un positivo indica el pico de LH; la ovulación llega ~1 día después. Afina la predicción, pero la confirmación segura sigue siendo temperatura + moco."
      >
        {LH_ORDER.map((opt, i) => (
          <IosListRow
            key={opt}
            showDivider={i < LH_ORDER.length - 1}
            onClick={() => setLh(opt)}
          >
            <span className="flex-1 text-ios-label">{LH_LABEL[opt]}</span>
            {lh === opt && <Checkmark />}
          </IosListRow>
        ))}
      </IosGroupedSection>

      <div className="h-2" />

      {/* Detalles */}
      <IosGroupedSection
        title="Detalles"
        footer="Marca el inicio de ciclo en el primer día de sangrado real (no manchado)."
      >
        <IosListRow showDivider>
          <div className="flex-1">
            <div className="text-ios-label">Inicio de ciclo</div>
            <div className="text-xs text-ios-secondary">Define el día 1</div>
          </div>
          <Toggle checked={isStart} onChange={setIsStart} />
        </IosListRow>
        <IosListRow showDivider={false}>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas"
            rows={3}
            className="w-full resize-none rounded-lg border border-ios-sep px-3 py-2 outline-none focus:border-brand-rose"
          />
        </IosListRow>
      </IosGroupedSection>

      <div className="h-5" />

      {/* Acciones */}
      <div className="flex gap-2 px-4">
        <button
          onClick={save}
          className="h-12 flex-1 rounded-xl bg-brand-rose font-semibold text-white active:opacity-80"
        >
          {savedAt ? "Guardado ✓" : "Guardar"}
        </button>
        <button
          onClick={onClear}
          disabled={!entry}
          className="h-12 flex-1 rounded-xl font-medium text-red-600 disabled:opacity-40"
        >
          Borrar día
        </button>
      </div>
    </div>
  );
}

function Checkmark() {
  return (
    <span
      className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-brand-rose text-xs font-bold text-white"
      aria-hidden
    >
      ✓
    </span>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 rounded-full transition-colors ${
        checked ? "bg-brand-rose" : "bg-ios-sep"
      }`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
