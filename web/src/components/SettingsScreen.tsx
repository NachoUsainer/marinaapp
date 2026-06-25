"use client";

import { useState } from "react";
import { IosGroupedSection, IosLargeTitle, IosListRow } from "./ios";
import { FertilityStore } from "@/data/store";
import { changePin, isValidPin } from "@/data/profiles";
import { MAX_CYCLE_LENGTH, MIN_CYCLE_LENGTH } from "@/domain/types";

export function SettingsScreen({
  store,
  profile,
  onLock,
}: {
  store: FertilityStore;
  profile: string;
  onLock: () => void;
}) {
  const { settings } = store;
  const [changingPin, setChangingPin] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [pinMsg, setPinMsg] = useState("");
  const [exportMsg, setExportMsg] = useState("");

  const exportData = async () => {
    const json = JSON.stringify(store.entries, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      setExportMsg("Copiado ✓");
    } catch {
      setExportMsg("No se pudo copiar");
    }
    window.setTimeout(() => setExportMsg(""), 1500);
  };

  const handleReset = () => {
    if (
      window.confirm(
        "¿Borrar todos los registros de este perfil? Esta acción no se puede deshacer."
      )
    ) {
      store.resetData();
    }
  };

  const submitPin = async () => {
    if (!isValidPin(newPin)) {
      setPinMsg("El PIN debe tener 4 dígitos.");
      return;
    }
    await changePin(profile, newPin);
    setNewPin("");
    setChangingPin(false);
    setPinMsg("PIN actualizado ✓");
    window.setTimeout(() => setPinMsg(""), 1500);
  };

  return (
    <div className="pb-6">
      <IosLargeTitle>Ajustes</IosLargeTitle>

      <IosGroupedSection title="Perfil">
        <IosListRow>
          <span className="flex-1 text-sm text-ios-label">Usuaria</span>
          <span className="text-sm font-medium text-ios-secondary">{profile}</span>
        </IosListRow>
        {!changingPin ? (
          <IosListRow onClick={() => { setChangingPin(true); setPinMsg(""); }}>
            <span className="flex-1 text-sm text-ios-label">Cambiar PIN</span>
            <span className="text-ios-tertiary">›</span>
          </IosListRow>
        ) : (
          <IosListRow>
            <input
              type="password"
              inputMode="numeric"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="Nuevo PIN"
              className="mr-2 w-28 rounded-lg border border-ios-sep px-3 py-2 text-center tracking-widest outline-none focus:border-brand-rose"
            />
            <button onClick={submitPin} className="mr-3 text-sm font-semibold text-brand-rose">
              Guardar
            </button>
            <button
              onClick={() => { setChangingPin(false); setNewPin(""); setPinMsg(""); }}
              className="text-sm text-ios-secondary"
            >
              Cancelar
            </button>
          </IosListRow>
        )}
        <IosListRow showDivider={false} onClick={onLock}>
          <span className="flex-1 text-sm font-medium text-brand-rose">Bloquear</span>
        </IosListRow>
      </IosGroupedSection>

      {pinMsg && (
        <p className="px-8 pt-1 text-xs text-ios-secondary">{pinMsg}</p>
      )}

      <div className="h-2" />

      <IosGroupedSection
        title="Ciclo de respaldo"
        footer="Estos valores se usan cuando aún no hay histórico suficiente. Con datos reales, el motor sintotérmico aprende y los reemplaza dinámicamente."
      >
        <SliderRow
          title="Duración del ciclo"
          value={settings.averageCycleLength}
          min={MIN_CYCLE_LENGTH}
          max={MAX_CYCLE_LENGTH}
          onChange={store.updateCycleLength}
        />
        <SliderRow
          title="Duración menstrual"
          value={settings.averagePeriodLength}
          min={2}
          max={10}
          onChange={store.updatePeriodLength}
        />
        <SliderRow
          title="Fase lútea"
          value={settings.lutealPhaseLength}
          min={10}
          max={16}
          onChange={store.updateLutealLength}
          last
        />
      </IosGroupedSection>

      <div className="h-2" />

      <IosGroupedSection
        title="Datos"
        footer="Reiniciar borra todos los registros de este perfil (no se puede deshacer). Útil para empezar de cero si los datos se han enredado."
      >
        <IosListRow onClick={exportData}>
          <span className="flex-1 text-sm text-ios-label">Exportar datos</span>
          <span className="text-sm text-ios-secondary">
            {exportMsg || `${store.entries.length} registros`}
          </span>
        </IosListRow>
        <IosListRow showDivider={false} onClick={handleReset}>
          <span className="flex-1 text-sm font-medium text-red-600">
            Reiniciar datos
          </span>
        </IosListRow>
      </IosGroupedSection>

      <div className="h-2" />

      <IosGroupedSection title="Privacidad">
        <IosListRow>
          <div className="flex-1">
            <div className="font-medium text-ios-label">100% local</div>
            <div className="text-xs text-ios-secondary">
              Tus datos viven solo en este navegador (localStorage). Sin nube ni
              telemetría.
            </div>
          </div>
        </IosListRow>
        <IosListRow showDivider={false}>
          <div className="flex-1">
            <div className="font-medium text-ios-label">Sin copia de seguridad</div>
            <div className="text-xs text-ios-secondary">
              Si borras los datos del navegador o cambias de dispositivo, el historial
              se pierde.
            </div>
          </div>
        </IosListRow>
      </IosGroupedSection>

      <div className="h-2" />

      <IosGroupedSection
        title="Aviso importante"
        footer="Sensiplan® — método sintotérmico desarrollado por Malteser Arbeitsgruppe NFP."
      >
        <IosListRow showDivider={false}>
          <span className="text-sm leading-snug text-ios-label">
            Esta aplicación calcula la fertilidad con el método{" "}
            <strong>sintotérmico (Sensiplan)</strong>: su fiabilidad depende de medir la
            temperatura y observar el moco correctamente cada día. Es una herramienta de
            apoyo informativo y <strong>no sustituye el consejo médico profesional</strong>;
            no es un anticonceptivo autorizado, no garantiza la prevención del embarazo y
            no debe usarse como único método anticonceptivo. Consulta siempre con personal
            sanitario cualificado.
          </span>
        </IosListRow>
      </IosGroupedSection>

      <div className="h-2" />

      <IosGroupedSection title="Acerca de">
        <IosListRow>
          <span className="flex-1 text-sm text-ios-label">Versión</span>
          <span className="text-sm text-ios-secondary">1.0 (web)</span>
        </IosListRow>
        <IosListRow showDivider={false}>
          <span className="flex-1 text-sm text-ios-label">Método de cálculo</span>
          <span className="text-sm text-ios-secondary">Sensiplan + menos-8 · LH opc.</span>
        </IosListRow>
      </IosGroupedSection>
    </div>
  );
}

function SliderRow({
  title,
  value,
  min,
  max,
  onChange,
  last = false,
}: {
  title: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  last?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center px-4 pt-3">
        <span className="flex-1 text-sm text-ios-label">{title}</span>
        <span className="text-sm text-ios-secondary">{value} días</span>
      </div>
      <div className="px-4 pb-3 pt-1">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-brand-rose"
          aria-label={title}
        />
      </div>
      {!last && <div className="ml-4 h-px bg-ios-sep" />}
    </div>
  );
}
