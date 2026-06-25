package com.example.fertilitytracker.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.ChevronLeft
import androidx.compose.material.icons.rounded.ChevronRight
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.example.fertilitytracker.domain.DayInsight
import com.example.fertilitytracker.domain.FertilityStatus
import com.example.fertilitytracker.ui.CalendarUiState
import com.example.fertilitytracker.ui.components.IosGroupedSection
import com.example.fertilitytracker.ui.components.IosLargeTitle
import com.example.fertilitytracker.ui.components.IosListRow
import com.example.fertilitytracker.ui.components.StatusPill
import com.example.fertilitytracker.ui.components.palette
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.TextStyle
import java.util.Locale

@Composable
fun CalendarScreen(
    state: CalendarUiState,
    onSelectDate: (LocalDate) -> Unit,
    onShowMonth: (YearMonth) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(bottom = 24.dp)
    ) {
        IosLargeTitle("Calendario")

        IosGroupedSection {
            MonthHeader(
                month = state.month,
                onPrev = { onShowMonth(state.month.minusMonths(1)) },
                onNext = { onShowMonth(state.month.plusMonths(1)) }
            )
            WeekdayLabels()
            MonthGrid(
                month = state.month,
                today = LocalDate.now(),
                selected = state.selectedDate,
                insights = state.insights,
                onSelect = onSelectDate
            )
            Spacer(Modifier.height(8.dp))
        }

        Spacer(Modifier.height(8.dp))

        SelectedDayCard(state)

        Spacer(Modifier.height(8.dp))

        CycleSummaryCard(state)

        Spacer(Modifier.height(8.dp))

        LegendCard()
    }
}

@Composable
private fun MonthHeader(month: YearMonth, onPrev: () -> Unit, onNext: () -> Unit) {
    Row(
        Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = "${month.month.getDisplayName(TextStyle.FULL, Locale("es")).replaceFirstChar { it.uppercase() }} ${month.year}",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.padding(start = 12.dp)
        )
        Row {
            IconButton(onClick = onPrev) {
                Icon(Icons.Rounded.ChevronLeft, contentDescription = "Mes anterior",
                    tint = MaterialTheme.colorScheme.primary)
            }
            IconButton(onClick = onNext) {
                Icon(Icons.Rounded.ChevronRight, contentDescription = "Mes siguiente",
                    tint = MaterialTheme.colorScheme.primary)
            }
        }
    }
}

@Composable
private fun WeekdayLabels() {
    val labels = listOf("L", "M", "X", "J", "V", "S", "D")
    Row(
        Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 4.dp)
    ) {
        labels.forEach { l ->
            Text(
                text = l,
                modifier = Modifier.weight(1f),
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
                fontWeight = FontWeight.SemiBold
            )
        }
    }
}

@Composable
private fun MonthGrid(
    month: YearMonth,
    today: LocalDate,
    selected: LocalDate,
    insights: Map<LocalDate, DayInsight>,
    onSelect: (LocalDate) -> Unit
) {
    val firstDay = month.atDay(1)
    val leadingBlanks = (firstDay.dayOfWeek.value - DayOfWeek.MONDAY.value + 7) % 7
    val totalCells = leadingBlanks + month.lengthOfMonth()
    val rows = (totalCells + 6) / 7

    Column(Modifier.padding(horizontal = 8.dp)) {
        for (r in 0 until rows) {
            Row(Modifier.fillMaxWidth()) {
                for (c in 0 until 7) {
                    val cellIdx = r * 7 + c
                    val dayNum = cellIdx - leadingBlanks + 1
                    Box(
                        modifier = Modifier.weight(1f).aspectRatio(1f),
                        contentAlignment = Alignment.Center
                    ) {
                        if (dayNum in 1..month.lengthOfMonth()) {
                            val date = month.atDay(dayNum)
                            DayCell(
                                date = date,
                                isToday = date == today,
                                isSelected = date == selected,
                                insight = insights[date],
                                onClick = { onSelect(date) }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun DayCell(
    date: LocalDate,
    isToday: Boolean,
    isSelected: Boolean,
    insight: DayInsight?,
    onClick: () -> Unit
) {
    val pal = insight?.status?.palette()
    val bg = pal?.background ?: Color.Transparent
    val fg = pal?.foreground ?: MaterialTheme.colorScheme.onSurface

    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(CircleShape)
                .background(bg)
                .let {
                    if (isSelected) it.border(2.dp, MaterialTheme.colorScheme.primary, CircleShape)
                    else if (isToday) it.border(1.5.dp, MaterialTheme.colorScheme.primary, CircleShape)
                    else it
                }
                .clickable(onClick = onClick),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = date.dayOfMonth.toString(),
                style = MaterialTheme.typography.bodyMedium,
                color = fg,
                fontWeight = if (isToday) FontWeight.Bold else FontWeight.Medium
            )
        }
        Row(
            modifier = Modifier.padding(top = 2.dp),
            horizontalArrangement = Arrangement.spacedBy(2.dp)
        ) {
            if (insight?.isPeakDay == true) Dot(MaterialTheme.colorScheme.primary)
            if (insight?.isTemperatureShiftDay == true) Dot(MaterialTheme.colorScheme.secondary)
            if (insight?.isOvulationEstimate == true && insight.isPeakDay != true) Dot(MaterialTheme.colorScheme.tertiary)
        }
    }
}

@Composable
private fun Dot(color: Color) {
    Box(Modifier.size(4.dp).clip(CircleShape).background(color))
}

@Composable
private fun SelectedDayCard(state: CalendarUiState) {
    val insight = state.insights[state.selectedDate]
    IosGroupedSection(title = "Día seleccionado") {
        IosListRow(showDivider = true) {
            Column(Modifier.weight(1f)) {
                Text(
                    state.selectedDate.toString(),
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.SemiBold
                )
                if (insight?.cycleDay != null) {
                    Text(
                        "Día ${insight.cycleDay} del ciclo",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            insight?.let { StatusPill(it.status) }
        }
        if (insight != null) {
            IosListRow(showDivider = false) {
                Text(
                    insight.explanation,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }
        }
    }
}

@Composable
private fun CycleSummaryCard(state: CalendarUiState) {
    IosGroupedSection(
        title = "Ciclo",
        footer = "Calculado por método sintotérmico (Sensiplan): doble control temperatura + moco."
    ) {
        IosListRow {
            Text("Longitud media", Modifier.weight(1f), color = MaterialTheme.colorScheme.onSurface)
            Text(
                "${state.averageCycleLength} días",
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        IosListRow {
            Text("Fase lútea media", Modifier.weight(1f), color = MaterialTheme.colorScheme.onSurface)
            Text(
                if (state.cyclesUsedForLuteal > 0)
                    "${state.averageLutealLength} días · ${state.cyclesUsedForLuteal} ciclos"
                else "${state.averageLutealLength} días (sin histórico)",
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        IosListRow {
            Text("Próxima ovulación", Modifier.weight(1f), color = MaterialTheme.colorScheme.onSurface)
            Text(
                state.nextOvulation?.toString() ?: "—",
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        IosListRow(showDivider = false) {
            Text("Próxima menstruación", Modifier.weight(1f), color = MaterialTheme.colorScheme.onSurface)
            Text(
                state.nextPeriod?.toString() ?: "—",
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun LegendCard() {
    IosGroupedSection(title = "Leyenda") {
        listOf(
            FertilityStatus.MENSTRUATION,
            FertilityStatus.INFERTILE,
            FertilityStatus.FERTILE,
            FertilityStatus.PEAK,
            FertilityStatus.UNCERTAIN
        ).forEachIndexed { i, status ->
            val pal = status.palette()
            IosListRow(showDivider = i < 4) {
                Box(Modifier.size(20.dp).clip(CircleShape).background(pal.background))
                Spacer(Modifier.width(12.dp))
                Text(
                    text = when (status) {
                        FertilityStatus.MENSTRUATION -> "Menstruación"
                        FertilityStatus.INFERTILE -> "Fertilidad baja"
                        FertilityStatus.FERTILE -> "Fertilidad alta"
                        FertilityStatus.PEAK -> "Fertilidad máxima"
                        FertilityStatus.UNCERTAIN -> "Datos inciertos"
                    },
                    Modifier.weight(1f),
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    pal.label,
                    color = pal.foreground,
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
    }
}
