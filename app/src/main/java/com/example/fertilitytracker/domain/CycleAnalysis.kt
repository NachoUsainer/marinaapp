package com.example.fertilitytracker.domain

import java.time.LocalDate

/**
 * Análisis de un ciclo menstrual completo o en curso, derivado por Sensiplan.
 */
data class CycleAnalysis(
    val cycleStartDate: LocalDate,
    val cycleEndDate: LocalDate?,
    val cycleLength: Int?,
    /** Día Pico = último día con moco fértil máximo (clara de huevo) dentro del ciclo. */
    val peakDay: LocalDate?,
    /** Día en que se confirma el aumento térmico (3ª temperatura de la subida). */
    val temperatureShiftDay: LocalDate?,
    /** Día con la temperatura más baja antes del salto térmico. */
    val nadirDate: LocalDate?,
    /** Media de las 6 temperaturas previas al salto. */
    val averageLowTemperature: Double?,
    /** Estimación de la fecha de ovulación (1 día antes del salto térmico, o el Día Pico). */
    val estimatedOvulationDate: LocalDate?,
    /**
     * Inicio de la fase infértil post-ovulatoria, confirmada por la regla del doble control:
     * el día siguiente al MÁS TARDÍO entre (Día Pico + 3) y el día del salto térmico.
     * Null si solo uno de los biomarcadores ha confirmado.
     */
    val confirmedInfertileFrom: LocalDate?,
    val lutealLength: Int?,
    /** Ciclo desviado más de un 20% de la media de los últimos 6 ciclos. */
    val isUncertain: Boolean
) {
    val isClosed: Boolean get() = cycleEndDate != null
    val ovulationConfirmed: Boolean get() = peakDay != null && temperatureShiftDay != null
}

/**
 * Resultado de análisis para una fecha concreta — alimenta directamente la UI.
 */
data class DayInsight(
    val date: LocalDate,
    val status: FertilityStatus,
    val cycleDay: Int?,
    val isMenstruation: Boolean,
    val isPeakDay: Boolean,
    val isOvulationEstimate: Boolean,
    val isTemperatureShiftDay: Boolean,
    val isNadir: Boolean,
    val isUncertain: Boolean,
    val explanation: String
)

/** Contenedor agregado del motor. */
data class FertilityResult(
    val statusByDate: Map<LocalDate, DayInsight>,
    val analyses: List<CycleAnalysis>,
    val averageCycleLength: Int,
    val averageLutealLength: Int,
    val shortestCycleLength: Int?,
    val cyclesUsedForLuteal: Int
) {
    val activeCycle: CycleAnalysis? get() = analyses.lastOrNull()
}
