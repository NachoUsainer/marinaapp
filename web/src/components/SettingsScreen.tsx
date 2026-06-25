"use client";

import { IosGroupedSection, IosLargeTitle, IosListRow } from "./ios";
import { FertilityStore } from "@/data/store";
import { MAX_CYCLE_LENGTH, MIN_CYCLE_LENGTH } from "@/domain/types";

export function SettingsScreen({ store }: { store: FertilityStore }) {
  const { settings } = store;

  return (
    <div className="pb-6">
      <IosLargeTitle>Ajustes</IosLargeTitle>

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
            Esta aplicación es una herramienta de apoyo informativo y{" "}
            <strong>no sustituye el consejo médico profesional</strong>. No garantiza la
            prevención del embarazo ni debe usarse como único método anticonceptivo.
            Consulta siempre con personal sanitario cualificado.
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
          <span className="text-sm text-ios-secondary">Sensiplan + Döring</span>
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
