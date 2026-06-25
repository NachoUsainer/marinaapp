package com.example.fertilitytracker.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.fertilitytracker.domain.CycleSettings
import com.example.fertilitytracker.ui.components.IosGroupedSection
import com.example.fertilitytracker.ui.components.IosLargeTitle
import com.example.fertilitytracker.ui.components.IosListRow

@Composable
fun SettingsScreen(
    settings: CycleSettings,
    onCycleLengthChange: (Int) -> Unit,
    onPeriodLengthChange: (Int) -> Unit,
    onLutealLengthChange: (Int) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(bottom = 24.dp)
    ) {
        IosLargeTitle("Ajustes")

        IosGroupedSection(
            title = "Ciclo de respaldo",
            footer = "Estos valores se usan cuando aún no hay histórico suficiente. " +
                "Con datos reales, el motor sintotérmico aprende y los reemplaza dinámicamente."
        ) {
            SliderRow(
                title = "Duración del ciclo",
                trailing = "${settings.averageCycleLength} días",
                value = settings.averageCycleLength,
                range = CycleSettings.MIN_CYCLE_LENGTH..CycleSettings.MAX_CYCLE_LENGTH,
                onChange = onCycleLengthChange,
                showDivider = true
            )
            SliderRow(
                title = "Duración menstrual",
                trailing = "${settings.averagePeriodLength} días",
                value = settings.averagePeriodLength,
                range = 2..10,
                onChange = onPeriodLengthChange,
                showDivider = true
            )
            SliderRow(
                title = "Fase lútea",
                trailing = "${settings.lutealPhaseLength} días",
                value = settings.lutealPhaseLength,
                range = 10..16,
                onChange = onLutealLengthChange,
                showDivider = false
            )
        }

        Spacer(Modifier.height(8.dp))

        IosGroupedSection(title = "Privacidad") {
            IosListRow(showDivider = true) {
                Column(Modifier.weight(1f)) {
                    Text("100% local", color = MaterialTheme.colorScheme.onSurface,
                        fontWeight = FontWeight.Medium)
                    Text(
                        "Room + DataStore en este dispositivo. Sin nube ni telemetría.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            IosListRow(showDivider = false) {
                Column(Modifier.weight(1f)) {
                    Text("Sin copia de seguridad",
                        color = MaterialTheme.colorScheme.onSurface, fontWeight = FontWeight.Medium)
                    Text(
                        "Los datos no se incluyen en backups de Google ni en transferencias entre dispositivos.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }

        Spacer(Modifier.height(8.dp))

        IosGroupedSection(
            title = "Acerca de",
            footer = "Sensiplan® — método sintotérmico desarrollado por Malteser Arbeitsgruppe NFP."
        ) {
            IosListRow(showDivider = true) {
                Text("Versión", Modifier.weight(1f), color = MaterialTheme.colorScheme.onSurface)
                Text("1.0", color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            IosListRow(showDivider = false) {
                Text("Método de cálculo", Modifier.weight(1f), color = MaterialTheme.colorScheme.onSurface)
                Text("Sensiplan + Döring", color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

@Composable
private fun SliderRow(
    title: String,
    trailing: String,
    value: Int,
    range: IntRange,
    onChange: (Int) -> Unit,
    showDivider: Boolean
) {
    var local by remember(value) { mutableFloatStateOf(value.toFloat()) }
    Column {
        IosListRow(showDivider = false) {
            Text(title, Modifier.weight(1f), color = MaterialTheme.colorScheme.onSurface)
            Text("${local.toInt()} días", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Slider(
            value = local,
            onValueChange = { local = it },
            onValueChangeFinished = { onChange(local.toInt()) },
            valueRange = range.first.toFloat()..range.last.toFloat(),
            steps = (range.last - range.first - 1).coerceAtLeast(0),
            colors = SliderDefaults.colors(
                thumbColor = MaterialTheme.colorScheme.primary,
                activeTrackColor = MaterialTheme.colorScheme.primary
            ),
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
        )
        if (showDivider) {
            androidx.compose.material3.HorizontalDivider(
                color = MaterialTheme.colorScheme.outline,
                thickness = 0.5.dp,
                modifier = Modifier.padding(start = 16.dp)
            )
        }
    }
}
