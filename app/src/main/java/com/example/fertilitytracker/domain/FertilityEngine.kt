package com.example.fertilitytracker.domain

import com.example.fertilitytracker.data.DayEntry
import com.example.fertilitytracker.data.MenstruationFlow
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import kotlin.math.abs

/**
 * Motor sintotérmico (Sensiplan) sin dependencias Android. Puro Kotlin → testeable.
 *
 * Reglas implementadas:
 *
 *  • TEMPERATURA — Aumento térmico:
 *      - 3 temperaturas consecutivas ≥ 0.1 °C por encima de las 6 anteriores ("low six").
 *      - La 3ª temperatura debe ser ≥ 0.2 °C sobre la MEDIA de esas 6 anteriores.
 *      - Solo se consideran ventanas tras el día 5 del ciclo (evita ruido menstrual).
 *
 *  • MOCO — Día Pico:
 *      - Último día con moco fértil máximo (clara de huevo) en el ciclo activo.
 *      - La fertilidad máxima cubre desde la aparición del moco fértil hasta P+3.
 *
 *  • DOBLE CONTROL:
 *      - La fase infértil post-ovulatoria se confirma el día siguiente al más
 *        tardío entre (P+3) y el día del salto térmico. Si solo uno de los dos
 *        ha confirmado, la fase fértil sigue abierta.
 *
 *  • DÖRING (apertura de la ventana fértil):
 *      - Apertura = (ciclo más corto registrado − 20). Por defecto cubre los 5
 *        primeros días si no hay histórico.
 *
 *  • IRREGULARIDAD:
 *      - Si la longitud del ciclo se desvía > 20% de la media de los últimos
 *        6 ciclos, se marca el ciclo como "Incierto" y los días sin biomarcador
 *        confirmado se reportan como UNCERTAIN.
 */
class FertilityEngine(
    private val today: LocalDate = LocalDate.now()
) {

    fun analyze(
        cycleStarts: List<LocalDate>,
        entries: List<DayEntry>,
        defaultCycleLength: Int = CycleSettings.DEFAULT_CYCLE_LENGTH,
        defaultLutealLength: Int = CycleSettings.DEFAULT_LUTEAL_PHASE
    ): FertilityResult {
        val sortedStarts = cycleStarts.sorted().distinct()
        val entriesByDate = entries.associateBy { it.localDate }

        if (sortedStarts.isEmpty()) {
            return FertilityResult(
                statusByDate = emptyMap(),
                analyses = emptyList(),
                averageCycleLength = defaultCycleLength,
                averageLutealLength = defaultLutealLength,
                shortestCycleLength = null,
                cyclesUsedForLuteal = 0
            )
        }

        val cycles = sortedStarts.mapIndexed { idx, start ->
            val nextStart = sortedStarts.getOrNull(idx + 1)
            CycleSpan(
                start = start,
                endIfClosed = nextStart?.minusDays(1)
            )
        }

        val closedLengths = cycles.mapNotNull { c ->
            c.endIfClosed?.let { ChronoUnit.DAYS.between(c.start, it).toInt() + 1 }
        }
        val averageCycle = if (closedLengths.isNotEmpty())
            closedLengths.takeLast(6).average().toInt()
        else defaultCycleLength
        val shortestCycle = closedLengths.takeLast(12).minOrNull()

        // Análisis individual de cada ciclo.
        val analyses = cycles.map { c ->
            analyzeCycle(c, entriesByDate, averageCycle)
        }

        val lutealHistory = analyses.mapNotNull { it.lutealLength }.takeLast(6)
        val averageLuteal = if (lutealHistory.isNotEmpty())
            lutealHistory.average().toInt()
        else defaultLutealLength

        // Construir el mapa día → DayInsight cubriendo todos los ciclos reales,
        // proyectar el ciclo activo hasta su final estimado y añadir 2 ciclos virtuales
        // hacia el futuro para que el calendario muestre la próxima ventana fértil.
        val statusByDate = mutableMapOf<LocalDate, DayInsight>()
        val effectiveShortest = shortestCycle ?: averageCycle

        analyses.forEachIndexed { idx, analysis ->
            val isLast = idx == cycles.lastIndex
            val projectionEnd = if (isLast)
                cycles[idx].start.plusDays(averageCycle.toLong() - 1)
            else null
            buildDailyInsights(
                cycle = cycles[idx],
                analysis = analysis,
                entriesByDate = entriesByDate,
                shortestCycle = effectiveShortest,
                averageCycle = averageCycle,
                averageLuteal = averageLuteal,
                projectionEnd = projectionEnd,
                output = statusByDate
            )
        }

        // Ciclos virtuales: solo predicción, sin biomarcadores.
        if (cycles.isNotEmpty()) {
            var phantomStart = cycles.last().start.plusDays(averageCycle.toLong())
            repeat(2) {
                val phantomCycle = CycleSpan(start = phantomStart, endIfClosed = null)
                val phantomAnalysis = CycleAnalysis(
                    cycleStartDate = phantomStart,
                    cycleEndDate = null,
                    cycleLength = null,
                    peakDay = null,
                    temperatureShiftDay = null,
                    nadirDate = null,
                    averageLowTemperature = null,
                    estimatedOvulationDate = null,
                    confirmedInfertileFrom = null,
                    lutealLength = null,
                    isUncertain = false
                )
                buildDailyInsights(
                    cycle = phantomCycle,
                    analysis = phantomAnalysis,
                    entriesByDate = entriesByDate,
                    shortestCycle = effectiveShortest,
                    averageCycle = averageCycle,
                    averageLuteal = averageLuteal,
                    projectionEnd = phantomStart.plusDays(averageCycle.toLong() - 1),
                    output = statusByDate
                )
                phantomStart = phantomStart.plusDays(averageCycle.toLong())
            }
        }

        return FertilityResult(
            statusByDate = statusByDate,
            analyses = analyses,
            averageCycleLength = averageCycle,
            averageLutealLength = averageLuteal,
            shortestCycleLength = shortestCycle,
            cyclesUsedForLuteal = lutealHistory.size
        )
    }

    private data class CycleSpan(val start: LocalDate, val endIfClosed: LocalDate?)

    // ───────── Análisis individual de un ciclo ─────────

    private fun analyzeCycle(
        cycle: CycleSpan,
        entriesByDate: Map<LocalDate, DayEntry>,
        averageCycle: Int
    ): CycleAnalysis {
        val effectiveEnd = cycle.endIfClosed ?: today
        val cycleLength = if (cycle.endIfClosed != null)
            ChronoUnit.DAYS.between(cycle.start, cycle.endIfClosed).toInt() + 1
        else null

        // ── Día Pico (último día con moco S+3) ──
        val peakDay = (cycle.start..effectiveEnd)
            .mapNotNull { entriesByDate[it] }
            .filter { it.cervicalMucus.isPeak }
            .maxByOrNull { it.localDate }
            ?.localDate

        // ── Salto térmico (3 temps ≥ +0.1 °C, 3ª ≥ +0.2 °C sobre la media de 6 previas) ──
        val tempShift = detectTemperatureShift(cycle.start, effectiveEnd, entriesByDate)

        // ── Nadir = temperatura mínima en los 7 días anteriores al salto térmico ──
        val nadir = tempShift?.let { shift ->
            val window = (shift.day.minusDays(8)..shift.day.minusDays(1))
            window
                .mapNotNull { entriesByDate[it] }
                .filter { it.basalTemperature != null }
                .minByOrNull { it.basalTemperature!! }
                ?.localDate
        }

        // ── Estimación de ovulación: día anterior al salto térmico, o Día Pico ──
        val ovulation = tempShift?.day?.minusDays(2) ?: peakDay

        // ── Confirmación post-ovulatoria (regla del doble control) ──
        val mucusCloseDay = peakDay?.plusDays(3)
        val tempCloseDay = tempShift?.day
        val confirmedInfertileFrom: LocalDate? =
            if (mucusCloseDay != null && tempCloseDay != null)
                maxOf(mucusCloseDay, tempCloseDay).plusDays(1)
            else null

        // ── Fase lútea (solo significativa con ovulación confirmada y ciclo cerrado) ──
        val luteal = if (cycle.endIfClosed != null && ovulation != null)
            ChronoUnit.DAYS.between(ovulation, cycle.endIfClosed).toInt()
        else null

        val isUncertain = cycleLength != null &&
            abs(cycleLength - averageCycle).toDouble() / averageCycle > 0.20

        return CycleAnalysis(
            cycleStartDate = cycle.start,
            cycleEndDate = cycle.endIfClosed,
            cycleLength = cycleLength,
            peakDay = peakDay,
            temperatureShiftDay = tempShift?.day,
            nadirDate = nadir,
            averageLowTemperature = tempShift?.lowAverage,
            estimatedOvulationDate = ovulation,
            confirmedInfertileFrom = confirmedInfertileFrom,
            lutealLength = luteal,
            isUncertain = isUncertain
        )
    }

    private data class TempShift(
        val day: LocalDate,
        val lowAverage: Double
    )

    /**
     * Recorre cada ventana posible dentro del ciclo. Para cada día candidato i (≥ 6º día tras el inicio):
     *   - lowSix = temps de los 6 días previos al primer día elevado.
     *   - rise = i, i+1, i+2 (3 días consecutivos).
     *   - Cada uno ≥ media(lowSix) + 0.1
     *   - i+2 ≥ media(lowSix) + 0.2
     */
    private fun detectTemperatureShift(
        cycleStart: LocalDate,
        cycleEnd: LocalDate,
        entriesByDate: Map<LocalDate, DayEntry>
    ): TempShift? {
        val days = (cycleStart..cycleEnd).toList()
        if (days.size < 9) return null

        for (firstHighIdx in 6 until days.size - 2) {
            val lowSix = (firstHighIdx - 6 until firstHighIdx)
                .mapNotNull { entriesByDate[days[it]]?.basalTemperature }
            if (lowSix.size < 6) continue

            val highs = (firstHighIdx..firstHighIdx + 2)
                .mapNotNull { entriesByDate[days[it]]?.basalTemperature }
            if (highs.size < 3) continue

            val mean = lowSix.average()
            val allUp = highs.all { it >= mean + 0.1 - 1e-9 }
            val thirdUp = highs[2] >= mean + 0.2 - 1e-9
            if (allUp && thirdUp) {
                return TempShift(day = days[firstHighIdx + 2], lowAverage = mean)
            }
        }
        return null
    }

    // ───────── Mapeo día → DayInsight ─────────

    private fun buildDailyInsights(
        cycle: CycleSpan,
        analysis: CycleAnalysis,
        entriesByDate: Map<LocalDate, DayEntry>,
        shortestCycle: Int,
        averageCycle: Int,
        averageLuteal: Int,
        output: MutableMap<LocalDate, DayInsight>,
        projectionEnd: LocalDate? = null
    ) {
        val end = projectionEnd ?: cycle.endIfClosed ?: today
        val doringOpenDay = cycle.start.plusDays((shortestCycle - 20 - 1).coerceAtLeast(0).toLong())

        // Estimación dinámica de ovulación si no está confirmada (para mostrar futuro):
        val projectedOvulation = analysis.estimatedOvulationDate
            ?: cycle.start.plusDays((averageCycle - averageLuteal - 1).toLong())
        val projectedFertileStart = projectedOvulation.minusDays(5)

        var d = cycle.start
        while (!d.isAfter(end)) {
            val entry = entriesByDate[d]
            val cycleDay = ChronoUnit.DAYS.between(cycle.start, d).toInt() + 1
            val flow = entry?.menstruationFlow ?: MenstruationFlow.NONE
            val isMenstruation = flow != MenstruationFlow.NONE && cycleDay <= 7

            val isPeak = analysis.peakDay == d
            val isOvulation = analysis.estimatedOvulationDate == d
            val isShift = analysis.temperatureShiftDay == d
            val isNadir = analysis.nadirDate == d

            // Determinación del estado:
            val status: FertilityStatus
            val explanation: String

            when {
                isMenstruation -> {
                    status = FertilityStatus.MENSTRUATION
                    explanation = "Día de menstruación"
                }
                analysis.confirmedInfertileFrom != null && !d.isBefore(analysis.confirmedInfertileFrom) -> {
                    status = FertilityStatus.INFERTILE
                    explanation = "Fase lútea confirmada (doble control: temperatura + moco)"
                }
                analysis.peakDay != null && !d.isBefore(analysis.peakDay) && d <= analysis.peakDay.plusDays(3) -> {
                    status = FertilityStatus.PEAK
                    explanation = if (isPeak) "Día Pico (último moco máximo)"
                        else "Fertilidad máxima — ${ChronoUnit.DAYS.between(analysis.peakDay, d)} día(s) tras el Día Pico"
                }
                entry?.cervicalMucus?.isFertile == true -> {
                    status = if (entry.cervicalMucus.isPeak) FertilityStatus.PEAK else FertilityStatus.FERTILE
                    explanation = "Moco fértil registrado: ${entry.cervicalMucus.label}"
                }
                d.isBefore(doringOpenDay) -> {
                    status = FertilityStatus.INFERTILE
                    explanation = "Antes de la apertura de Döring (ciclo más corto −20)"
                }
                analysis.isUncertain -> {
                    status = FertilityStatus.UNCERTAIN
                    explanation = "Ciclo irregular: confíe solo en biomarcadores"
                }
                analysis.peakDay == null && d == projectedOvulation -> {
                    status = FertilityStatus.PEAK
                    explanation = "Día de ovulación estimado por algoritmo dinámico"
                }
                !d.isBefore(projectedFertileStart) && !d.isAfter(projectedOvulation.plusDays(1)) -> {
                    status = FertilityStatus.FERTILE
                    explanation = "Ventana fértil estimada (sin confirmación aún)"
                }
                else -> {
                    status = FertilityStatus.INFERTILE
                    explanation = "Fuera de la ventana fértil estimada"
                }
            }

            output[d] = DayInsight(
                date = d,
                status = status,
                cycleDay = cycleDay,
                isMenstruation = isMenstruation,
                isPeakDay = isPeak,
                isOvulationEstimate = isOvulation,
                isTemperatureShiftDay = isShift,
                isNadir = isNadir,
                isUncertain = analysis.isUncertain,
                explanation = explanation
            )
            d = d.plusDays(1)
        }
    }

    // ───────── helpers ─────────

    private operator fun LocalDate.rangeTo(other: LocalDate) = LocalDateProgression(this, other)
}

/** Iterador inclusivo de fechas. */
class LocalDateProgression(
    private val from: LocalDate,
    private val to: LocalDate
) : Iterable<LocalDate> {
    override fun iterator(): Iterator<LocalDate> = object : Iterator<LocalDate> {
        private var current = from
        override fun hasNext(): Boolean = !current.isAfter(to)
        override fun next(): LocalDate {
            val r = current
            current = current.plusDays(1)
            return r
        }
    }
}
