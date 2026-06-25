package com.example.fertilitytracker.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.fertilitytracker.data.CervicalMucus
import com.example.fertilitytracker.data.DayEntry
import com.example.fertilitytracker.domain.CycleAnalysis
import com.example.fertilitytracker.ui.components.IosGroupedSection
import com.example.fertilitytracker.ui.components.IosLargeTitle
import com.example.fertilitytracker.ui.components.IosListRow
import com.example.fertilitytracker.ui.theme.AccentBlue
import com.example.fertilitytracker.ui.theme.AccentLavender
import com.example.fertilitytracker.ui.theme.AccentOrange
import com.example.fertilitytracker.ui.theme.AccentRose
import java.time.LocalDate

@Composable
fun TrendsScreen(
    entries: List<DayEntry>,
    activeAnalysis: CycleAnalysis?,
    modifier: Modifier = Modifier
) {
    val withTemp = entries.filter { it.basalTemperature != null }.sortedBy { it.localDate }

    Column(
        modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(bottom = 24.dp)
    ) {
        IosLargeTitle("Tendencias")

        IosGroupedSection(
            title = "Temperatura basal",
            footer = "El motor identifica el nadir (mínimo) y el salto térmico (regla 3 sobre 6)."
        ) {
            Box(Modifier.padding(16.dp).fillMaxWidth()) {
                if (withTemp.size < 2) {
                    Text(
                        "Registra al menos 2 mediciones para ver la curva.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                } else {
                    BasalChart(
                        entries = withTemp,
                        analysis = activeAnalysis,
                        primary = AccentRose,
                        nadirColor = AccentBlue,
                        shiftColor = AccentOrange,
                        gridColor = MaterialTheme.colorScheme.outline,
                        textColor = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            if (activeAnalysis != null) {
                IosListRow {
                    LegendDot(AccentBlue, "Nadir")
                    Spacer(Modifier.width(16.dp))
                    LegendDot(AccentOrange, "Salto térmico")
                    Spacer(Modifier.width(16.dp))
                    LegendDot(AccentLavender, "Día Pico")
                }
            }
        }

        Spacer(Modifier.height(8.dp))

        IosGroupedSection(
            title = "Moco cervical (últimos 30 días)",
            footer = "Altura de la barra = nivel Sensiplan (0-3). Pico = clara de huevo."
        ) {
            Box(Modifier.padding(16.dp).fillMaxWidth()) {
                MucusBars(
                    entries = entries.takeLast(30),
                    color = MaterialTheme.colorScheme.primary,
                    gridColor = MaterialTheme.colorScheme.outline
                )
            }
        }

        Spacer(Modifier.height(8.dp))

        if (activeAnalysis != null) {
            IosGroupedSection(title = "Ciclo activo") {
                IosListRow {
                    Text("Inicio", Modifier.weight(1f), color = MaterialTheme.colorScheme.onSurface)
                    Text(activeAnalysis.cycleStartDate.toString(),
                        color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                IosListRow {
                    Text("Día Pico", Modifier.weight(1f), color = MaterialTheme.colorScheme.onSurface)
                    Text(activeAnalysis.peakDay?.toString() ?: "Pendiente",
                        color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                IosListRow {
                    Text("Salto térmico", Modifier.weight(1f), color = MaterialTheme.colorScheme.onSurface)
                    Text(activeAnalysis.temperatureShiftDay?.toString() ?: "Pendiente",
                        color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                IosListRow {
                    Text("Ovulación estimada", Modifier.weight(1f), color = MaterialTheme.colorScheme.onSurface)
                    Text(activeAnalysis.estimatedOvulationDate?.toString() ?: "—",
                        color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                IosListRow(showDivider = false) {
                    Text("Doble control", Modifier.weight(1f), color = MaterialTheme.colorScheme.onSurface)
                    Text(
                        if (activeAnalysis.ovulationConfirmed) "Confirmado ✓" else "Pendiente",
                        color = if (activeAnalysis.ovulationConfirmed)
                            MaterialTheme.colorScheme.tertiary
                        else MaterialTheme.colorScheme.onSurfaceVariant,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
            if (activeAnalysis.isUncertain) {
                Spacer(Modifier.height(8.dp))
                IosGroupedSection(title = "Aviso") {
                    IosListRow(showDivider = false) {
                        Text(
                            "Ciclo desviado más del 20% del promedio. Confíe únicamente en biomarcadores.",
                            color = MaterialTheme.colorScheme.error,
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun LegendDot(color: Color, label: String) {
    Row(verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
        Box(Modifier.size(10.dp).background(color, androidx.compose.foundation.shape.CircleShape))
        Spacer(Modifier.width(6.dp))
        Text(label, style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
private fun BasalChart(
    entries: List<DayEntry>,
    analysis: CycleAnalysis?,
    primary: Color,
    nadirColor: Color,
    shiftColor: Color,
    gridColor: Color,
    textColor: Color
) {
    val temps = entries.mapNotNull { it.basalTemperature }
    val min = (temps.min() - 0.2).coerceAtLeast(35.5)
    val max = (temps.max() + 0.2).coerceAtMost(38.0)
    val range = (max - min).coerceAtLeast(0.5)
    val density = LocalDensity.current

    val nadirIdx = analysis?.nadirDate?.let { date -> entries.indexOfFirst { it.localDate == date } }
        ?.takeIf { it >= 0 }
    val shiftIdx = analysis?.temperatureShiftDay?.let { date -> entries.indexOfFirst { it.localDate == date } }
        ?.takeIf { it >= 0 }
    val peakIdx = analysis?.peakDay?.let { date -> entries.indexOfFirst { it.localDate == date } }
        ?.takeIf { it >= 0 }
    val lowAvg = analysis?.averageLowTemperature

    Canvas(Modifier.fillMaxWidth().height(220.dp)) {
        val w = size.width
        val h = size.height
        val stepX = if (entries.size > 1) w / (entries.size - 1) else w

        // Líneas de referencia horizontales
        repeat(4) { i ->
            val y = h * i / 3f
            drawLine(
                color = gridColor,
                start = Offset(0f, y),
                end = Offset(w, y),
                strokeWidth = 0.8f,
                pathEffect = PathEffect.dashPathEffect(floatArrayOf(6f, 6f))
            )
        }

        // Línea base media (low six average)
        if (lowAvg != null) {
            val y = h - ((lowAvg - min) / range * h).toFloat()
            drawLine(
                color = nadirColor.copy(alpha = 0.6f),
                start = Offset(0f, y),
                end = Offset(w, y),
                strokeWidth = 1.5f,
                pathEffect = PathEffect.dashPathEffect(floatArrayOf(8f, 6f))
            )
        }

        // Banda de salto térmico (después del shift)
        if (shiftIdx != null) {
            val xShift = shiftIdx * stepX
            drawRect(
                color = shiftColor.copy(alpha = 0.08f),
                topLeft = Offset(xShift, 0f),
                size = Size(w - xShift, h)
            )
        }

        // Curva temperatura
        val points = entries.mapIndexedNotNull { i, e ->
            e.basalTemperature?.let {
                val x = i * stepX
                val y = h - ((it - min) / range * h).toFloat()
                Offset(x, y)
            }
        }
        for (i in 0 until points.lastIndex) {
            drawLine(
                color = primary,
                start = points[i],
                end = points[i + 1],
                strokeWidth = 3f,
                cap = StrokeCap.Round
            )
        }
        points.forEach { p ->
            drawCircle(primary, radius = 3.5f, center = p)
        }

        // Anotaciones: nadir / shift / peak
        nadirIdx?.let { idx ->
            entries[idx].basalTemperature?.let { t ->
                val x = idx * stepX
                val y = h - ((t - min) / range * h).toFloat()
                drawCircle(nadirColor, radius = 8f, center = Offset(x, y))
                drawCircle(Color.White, radius = 4f, center = Offset(x, y))
                drawCircle(nadirColor, radius = 2.5f, center = Offset(x, y))
            }
        }
        shiftIdx?.let { idx ->
            entries[idx].basalTemperature?.let { t ->
                val x = idx * stepX
                val y = h - ((t - min) / range * h).toFloat()
                drawCircle(shiftColor, radius = 8f, center = Offset(x, y))
                drawCircle(Color.White, radius = 4f, center = Offset(x, y))
                drawCircle(shiftColor, radius = 2.5f, center = Offset(x, y))
            }
        }
        peakIdx?.let { idx ->
            val x = idx * stepX
            drawLine(
                color = AccentLavender.copy(alpha = 0.5f),
                start = Offset(x, 0f),
                end = Offset(x, h),
                strokeWidth = 2f,
                pathEffect = PathEffect.dashPathEffect(floatArrayOf(4f, 4f))
            )
        }
    }
}

@Composable
private fun MucusBars(entries: List<DayEntry>, color: Color, gridColor: Color) {
    if (entries.isEmpty()) {
        Text(
            "Sin datos",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        return
    }
    Canvas(Modifier.fillMaxWidth().height(130.dp)) {
        val w = size.width
        val h = size.height
        val barWidth = w / entries.size
        val maxScore = CervicalMucus.EGG_WHITE.fertilityScore.toFloat()

        repeat(3) { i ->
            val y = h * (i + 1) / 4f
            drawLine(gridColor, Offset(0f, y), Offset(w, y), strokeWidth = 0.6f)
        }
        entries.forEachIndexed { i, e ->
            val score = e.cervicalMucus.fertilityScore.toFloat()
            if (score == 0f) return@forEachIndexed
            val barH = (score / maxScore) * h
            drawRect(
                color = color.copy(alpha = 0.35f + 0.65f * (score / maxScore)),
                topLeft = Offset(i * barWidth + 2f, h - barH),
                size = Size(barWidth - 4f, barH)
            )
        }
    }
}
