package com.example.fertilitytracker.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.example.fertilitytracker.data.CervicalMucus
import com.example.fertilitytracker.data.DayEntry
import com.example.fertilitytracker.data.MenstruationFlow
import com.example.fertilitytracker.ui.components.IosGroupedSection
import com.example.fertilitytracker.ui.components.IosLargeTitle
import com.example.fertilitytracker.ui.components.IosListRow
import java.time.LocalDate

@Composable
fun DailyLogScreen(
    selectedDate: LocalDate,
    entry: DayEntry?,
    onSave: (basal: Double?, mucus: CervicalMucus, flow: MenstruationFlow, isStart: Boolean, notes: String) -> Unit,
    onClear: () -> Unit,
    modifier: Modifier = Modifier
) {
    var basalText by remember(entry) { mutableStateOf(entry?.basalTemperature?.toString().orEmpty()) }
    var mucus by remember(entry) { mutableStateOf(entry?.cervicalMucus ?: CervicalMucus.NONE) }
    var flow by remember(entry) { mutableStateOf(entry?.menstruationFlow ?: MenstruationFlow.NONE) }
    var isStart by remember(entry) { mutableStateOf(entry?.isCycleStart ?: false) }
    var notes by remember(entry) { mutableStateOf(entry?.notes.orEmpty()) }

    Column(
        modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(bottom = 24.dp)
    ) {
        IosLargeTitle("Registro")
        Text(
            text = selectedDate.toString(),
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(start = 16.dp, bottom = 8.dp)
        )

        // ─── Temperatura ───
        IosGroupedSection(
            title = "Temperatura basal",
            footer = "Tómate la temperatura al despertar, siempre a la misma hora."
        ) {
            IosListRow(showDivider = false) {
                Text("°C", Modifier.padding(end = 12.dp), color = MaterialTheme.colorScheme.onSurfaceVariant)
                OutlinedTextField(
                    value = basalText,
                    onValueChange = { basalText = it.filter { c -> c.isDigit() || c == '.' || c == ',' } },
                    placeholder = { Text("36.5") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }

        Spacer(Modifier.height(8.dp))

        // ─── Moco ───
        IosGroupedSection(
            title = "Moco cervical (Sensiplan)",
            footer = "El moco \"clara de huevo\" define el Día Pico."
        ) {
            CervicalMucus.values().forEachIndexed { i, opt ->
                IosListRow(
                    showDivider = i < CervicalMucus.values().lastIndex,
                    onClick = { mucus = opt }
                ) {
                    Column(Modifier.weight(1f)) {
                        Text(
                            opt.label,
                            color = MaterialTheme.colorScheme.onSurface,
                            style = MaterialTheme.typography.bodyLarge
                        )
                        Text(
                            sensiplanHint(opt),
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                    if (mucus == opt) Checkmark()
                }
            }
        }

        Spacer(Modifier.height(8.dp))

        // ─── Menstruación ───
        IosGroupedSection(title = "Sangrado") {
            MenstruationFlow.values().forEachIndexed { i, opt ->
                IosListRow(
                    showDivider = i < MenstruationFlow.values().lastIndex,
                    onClick = { flow = opt }
                ) {
                    Text(opt.label, Modifier.weight(1f), color = MaterialTheme.colorScheme.onSurface)
                    if (flow == opt) Checkmark()
                }
            }
        }

        Spacer(Modifier.height(8.dp))

        // ─── Inicio de ciclo + notas ───
        IosGroupedSection(
            title = "Detalles",
            footer = "Marca el inicio de ciclo en el primer día de sangrado real (no manchado)."
        ) {
            IosListRow(showDivider = true) {
                Column(Modifier.weight(1f)) {
                    Text("Inicio de ciclo", color = MaterialTheme.colorScheme.onSurface)
                    Text(
                        "Define el día 1",
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        style = MaterialTheme.typography.bodySmall
                    )
                }
                Switch(
                    checked = isStart,
                    onCheckedChange = { isStart = it },
                    colors = SwitchDefaults.colors(
                        checkedTrackColor = MaterialTheme.colorScheme.primary
                    )
                )
            }
            IosListRow(showDivider = false) {
                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    placeholder = { Text("Notas") },
                    modifier = Modifier.fillMaxWidth().heightIn(min = 80.dp)
                )
            }
        }

        Spacer(Modifier.height(20.dp))

        // ─── Acciones ───
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(
                modifier = Modifier.weight(1f).heightIn(min = 50.dp),
                shape = MaterialTheme.shapes.medium,
                onClick = {
                    val temp = basalText.replace(',', '.').toDoubleOrNull()
                    onSave(temp, mucus, flow, isStart, notes.trim())
                },
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    contentColor = MaterialTheme.colorScheme.onPrimary
                )
            ) { Text("Guardar", fontWeight = FontWeight.SemiBold) }
            TextButton(
                modifier = Modifier.weight(1f).heightIn(min = 50.dp),
                onClick = onClear,
                enabled = entry != null
            ) {
                Text("Borrar día", color = MaterialTheme.colorScheme.error)
            }
        }
    }
}

@Composable
private fun Checkmark() {
    Box(
        Modifier
            .size(22.dp)
            .clip(RoundedCornerShape(11.dp))
            .background(MaterialTheme.colorScheme.primary),
        contentAlignment = Alignment.Center
    ) {
        Text("✓", color = Color.White, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
    }
}

private fun sensiplanHint(m: CervicalMucus): String = when (m) {
    CervicalMucus.NONE -> "Sin observación"
    CervicalMucus.DRY -> "Categoría t · No fértil"
    CervicalMucus.STICKY -> "Categoría S · Fertilidad baja"
    CervicalMucus.CREAMY -> "Categoría S+ · Fertilidad real"
    CervicalMucus.WATERY -> "Categoría S+ · Fertilidad real"
    CervicalMucus.EGG_WHITE -> "Categoría S+ · Día Pico"
}
