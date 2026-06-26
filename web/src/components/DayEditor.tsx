"use client";

import { useEffect, useState } from "react";
import { IosGroupedSection, IosListRow } from "./ios";
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
import { ISODate } from "@/lib/date";

/** Formulario de registro de un día. El día lo elige el calendario. */
export function DayEditor({
  selectedDate,
  entry,
  onSave,
  onClear,
}: {
  selectedDate: ISODate;
  entry: DayEntry | undefined;
  onSave: (e: DayEntry) => void;
  onClear: () => void;
}) {
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
    <div>
      {/* Sangrado — primero, es lo más habitual */}
      <IosGroupedSection
        title="Sangrado"
        footer="Marca el inicio de ciclo abajo si es el primer día de regla."
      >
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

      {/* Inicio de ciclo + notas */}
      <IosGroupedSection
        title="Detalles"
        footer="Marca el inicio de ciclo en el primer día de sangrado real (no manchado). Es lo que define tu Día 1."
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
            rows={2}
            className="w-full resize-none rounded-lg border border-ios-sep px-3 py-2 outline-none focus:border-brand-rose"
          />
        </IosListRow>
      </IosGroupedSection>

      <div className="h-2" />

      {/* Temperatura */}
      <IosGroupedSection
        title="Temperatura basal"
        footer="Opcional pero recomendado. Tómala al despertar, antes de levantarte, siempre a la misma hora."
      >
        <IosListRow showDivider={false}>
          <span className="mr-3 text-ios-secondary">°C</span>
          <input
            type="text"
            inputMode="decimal"
            value={basalText}
            onChange={(e) => setBasalText(e.target.value.replace(/[^0-9.,]/g, ""))}
            placeholder="36.5"
            className="w-full rounded-lg border border-ios-sep px-3 py-2 outline-none focus:border-brand-rose"
          />
        </IosListRow>
      </IosGroupedSection>

      <div className="h-2" />

      {/* Moco */}
      <IosGroupedSection
        title="Moco cervical (opcional)"
        footer={'El moco "clara de huevo" indica máxima fertilidad (Día Pico).'}
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

      {/* Test de ovulación (LH) */}
      <IosGroupedSection
        title="Test de ovulación (LH, opcional)"
        footer="Un positivo indica el pico de LH; la ovulación llega ~1 día después."
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

      <div className="h-5" />

      {/* Acciones */}
      <div className="flex gap-2 px-4">
        <button
          onClick={save}
          className="h-12 flex-1 rounded-xl bg-brand-rose font-semibold text-white active:opacity-80"
        >
          {savedAt ? "Guardado ✓" : "Guardar día"}
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
