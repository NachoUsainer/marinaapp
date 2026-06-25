"use client";

import { IosGroupedSection, IosLargeTitle, IosListRow } from "./ios";
import {
  CycleAnalysis,
  DayEntry,
  isOvulationConfirmed,
  MAX_MUCUS_SCORE,
  MUCUS_META,
} from "@/domain/types";
import { formatLong } from "@/lib/date";

const ROSE = "#FF375F";
const BLUE = "#007AFF";
const ORANGE = "#FF9500";
const LAVENDER = "#AF52DE";
const GRID = "#E5E5EA";

export function TrendsScreen({
  entries,
  analysis,
}: {
  entries: DayEntry[];
  analysis: CycleAnalysis | null;
}) {
  const withTemp = entries
    .filter((e) => e.basalTemperature != null)
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  return (
    <div className="pb-6">
      <IosLargeTitle>Tendencias</IosLargeTitle>

      <IosGroupedSection
        title="Temperatura basal"
        footer="El motor identifica el nadir (mínimo) y el salto térmico (regla 3 sobre 6)."
      >
        <div className="p-4">
          {withTemp.length < 2 ? (
            <p className="text-sm text-ios-secondary">
              Registra al menos 2 mediciones para ver la curva.
            </p>
          ) : (
            <BasalChart entries={withTemp} analysis={analysis} />
          )}
        </div>
        {analysis && (
          <IosListRow showDivider={false}>
            <Legend color={BLUE} label="Nadir" />
            <span className="w-4" />
            <Legend color={ORANGE} label="Salto térmico" />
            <span className="w-4" />
            <Legend color={LAVENDER} label="Día Pico" />
          </IosListRow>
        )}
      </IosGroupedSection>

      <div className="h-2" />

      <IosGroupedSection
        title="Moco cervical (últimos 30 días)"
        footer="Altura de la barra = nivel Sensiplan (0-3). Pico = clara de huevo."
      >
        <div className="p-4">
          <MucusBars entries={entries.slice(-30)} />
        </div>
      </IosGroupedSection>

      {analysis && (
        <>
          <div className="h-2" />
          <IosGroupedSection title="Ciclo activo">
            <InfoRow label="Inicio" value={formatLong(analysis.cycleStartDate)} />
            <InfoRow
              label="Día Pico"
              value={analysis.peakDay ? formatLong(analysis.peakDay) : "Pendiente"}
            />
            <InfoRow
              label="Salto térmico"
              value={
                analysis.temperatureShiftDay
                  ? formatLong(analysis.temperatureShiftDay)
                  : "Pendiente"
              }
            />
            <InfoRow
              label="Pico LH"
              value={analysis.lhSurgeDate ? formatLong(analysis.lhSurgeDate) : "Sin test"}
            />
            <InfoRow
              label="Ovulación estimada"
              value={
                analysis.estimatedOvulationDate
                  ? formatLong(analysis.estimatedOvulationDate)
                  : "—"
              }
            />
            <IosListRow showDivider={false}>
              <span className="flex-1 text-sm text-ios-label">Doble control</span>
              <span
                className="text-sm font-semibold"
                style={{
                  color: isOvulationConfirmed(analysis) ? "#00897B" : "#8E8E93",
                }}
              >
                {isOvulationConfirmed(analysis) ? "Confirmado ✓" : "Pendiente"}
              </span>
            </IosListRow>
          </IosGroupedSection>

          {analysis.isUncertain && (
            <>
              <div className="h-2" />
              <IosGroupedSection title="Aviso">
                <IosListRow showDivider={false}>
                  <span className="text-sm text-red-600">
                    Ciclo desviado más del 20% del promedio. Confíe únicamente en
                    biomarcadores.
                  </span>
                </IosListRow>
              </IosGroupedSection>
            </>
          )}
        </>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <IosListRow>
      <span className="flex-1 text-sm text-ios-label">{label}</span>
      <span className="text-sm text-ios-secondary">{value}</span>
    </IosListRow>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-xs text-ios-secondary">{label}</span>
    </span>
  );
}

const W = 600;
const H_TEMP = 240;

function BasalChart({
  entries,
  analysis,
}: {
  entries: DayEntry[];
  analysis: CycleAnalysis | null;
}) {
  const temps = entries.map((e) => e.basalTemperature as number);
  const min = Math.max(Math.min(...temps) - 0.2, 35.5);
  const max = Math.min(Math.max(...temps) + 0.2, 38.0);
  const range = Math.max(max - min, 0.5);
  const stepX = entries.length > 1 ? W / (entries.length - 1) : W;
  const yOf = (t: number) => H_TEMP - ((t - min) / range) * H_TEMP;

  const indexOfDate = (d: string | null) =>
    d == null ? -1 : entries.findIndex((e) => e.date === d);
  const nadirIdx = indexOfDate(analysis?.nadirDate ?? null);
  const shiftIdx = indexOfDate(analysis?.temperatureShiftDay ?? null);
  const peakIdx = indexOfDate(analysis?.peakDay ?? null);
  const coverline = analysis?.coverlineTemperature ?? null;

  const points = entries.map((e, i) => ({
    x: i * stepX,
    y: yOf(e.basalTemperature as number),
  }));

  return (
    <svg
      viewBox={`0 0 ${W} ${H_TEMP}`}
      className="h-56 w-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Gráfica de temperatura basal"
    >
      {/* Rejilla */}
      {[0, 1, 2, 3].map((i) => (
        <line
          key={i}
          x1={0}
          y1={(H_TEMP * i) / 3}
          x2={W}
          y2={(H_TEMP * i) / 3}
          stroke={GRID}
          strokeWidth={0.8}
          strokeDasharray="6 6"
        />
      ))}

      {/* Coverline (máximo de las 6 temperaturas bajas previas) */}
      {coverline != null && (
        <line
          x1={0}
          y1={yOf(coverline)}
          x2={W}
          y2={yOf(coverline)}
          stroke={BLUE}
          strokeOpacity={0.6}
          strokeWidth={1.5}
          strokeDasharray="8 6"
        />
      )}

      {/* Banda post-salto */}
      {shiftIdx >= 0 && (
        <rect
          x={shiftIdx * stepX}
          y={0}
          width={W - shiftIdx * stepX}
          height={H_TEMP}
          fill={ORANGE}
          fillOpacity={0.08}
        />
      )}

      {/* Línea del Día Pico */}
      {peakIdx >= 0 && (
        <line
          x1={peakIdx * stepX}
          y1={0}
          x2={peakIdx * stepX}
          y2={H_TEMP}
          stroke={LAVENDER}
          strokeOpacity={0.5}
          strokeWidth={2}
          strokeDasharray="4 4"
        />
      )}

      {/* Curva */}
      <polyline
        points={points.map((p) => `${p.x},${p.y}`).join(" ")}
        fill="none"
        stroke={ROSE}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3.5} fill={ROSE} />
      ))}

      {/* Marcadores nadir / shift */}
      {nadirIdx >= 0 && <Marker p={points[nadirIdx]} color={BLUE} />}
      {shiftIdx >= 0 && <Marker p={points[shiftIdx]} color={ORANGE} />}
    </svg>
  );
}

function Marker({ p, color }: { p: { x: number; y: number }; color: string }) {
  return (
    <>
      <circle cx={p.x} cy={p.y} r={8} fill={color} />
      <circle cx={p.x} cy={p.y} r={4} fill="white" />
      <circle cx={p.x} cy={p.y} r={2.5} fill={color} />
    </>
  );
}

const H_MUCUS = 130;

function MucusBars({ entries }: { entries: DayEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-xs text-ios-secondary">Sin datos</p>;
  }
  const barWidth = W / entries.length;

  return (
    <svg
      viewBox={`0 0 ${W} ${H_MUCUS}`}
      className="h-32 w-full"
      preserveAspectRatio="none"
      role="img"
      aria-label="Gráfica de moco cervical"
    >
      {[1, 2, 3].map((i) => (
        <line
          key={i}
          x1={0}
          y1={(H_MUCUS * i) / 4}
          x2={W}
          y2={(H_MUCUS * i) / 4}
          stroke={GRID}
          strokeWidth={0.6}
        />
      ))}
      {entries.map((e, i) => {
        const score = MUCUS_META[e.cervicalMucus].score;
        if (score === 0) return null;
        const ratio = score / MAX_MUCUS_SCORE;
        const barH = ratio * H_MUCUS;
        return (
          <rect
            key={i}
            x={i * barWidth + 2}
            y={H_MUCUS - barH}
            width={barWidth - 4}
            height={barH}
            fill={ROSE}
            fillOpacity={0.35 + 0.65 * ratio}
          />
        );
      })}
    </svg>
  );
}
