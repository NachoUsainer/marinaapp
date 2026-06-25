package com.example.fertilitytracker.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.fertilitytracker.domain.FertilityStatus
import com.example.fertilitytracker.ui.theme.StatusFertileLight
import com.example.fertilitytracker.ui.theme.StatusFertileText
import com.example.fertilitytracker.ui.theme.StatusInfertileLight
import com.example.fertilitytracker.ui.theme.StatusInfertileText
import com.example.fertilitytracker.ui.theme.StatusMenstruationLight
import com.example.fertilitytracker.ui.theme.StatusMenstruationText
import com.example.fertilitytracker.ui.theme.StatusPeakLight
import com.example.fertilitytracker.ui.theme.StatusPeakText
import com.example.fertilitytracker.ui.theme.StatusUncertainLight
import com.example.fertilitytracker.ui.theme.StatusUncertainText

/** "Inset grouped" — el contenedor blanco redondeado que usa iOS para listas. */
@Composable
fun IosGroupedSection(
    title: String? = null,
    footer: String? = null,
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit
) {
    Column(modifier.fillMaxWidth()) {
        if (title != null) {
            Text(
                text = title.uppercase(),
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(start = 32.dp, top = 16.dp, bottom = 6.dp, end = 16.dp)
            )
        }
        Column(
            Modifier
                .padding(horizontal = 16.dp)
                .clip(MaterialTheme.shapes.large)
                .background(MaterialTheme.colorScheme.surface)
        ) { content() }
        if (footer != null) {
            Text(
                text = footer,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(horizontal = 32.dp, vertical = 6.dp)
            )
        }
    }
}

/** Fila estilo iOS (con separadores entre filas pero no en bordes). */
@Composable
fun IosListRow(
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    showDivider: Boolean = true,
    content: @Composable RowScope.() -> Unit
) {
    Column {
        Row(
            modifier
                .fillMaxWidth()
                .let { if (onClick != null) it.clickable(onClick = onClick) else it }
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            content = content
        )
        if (showDivider) {
            HorizontalDivider(
                color = MaterialTheme.colorScheme.outline,
                thickness = 0.5.dp,
                modifier = Modifier.padding(start = 16.dp)
            )
        }
    }
}

@Composable
fun IosLargeTitle(text: String, modifier: Modifier = Modifier) {
    Text(
        text = text,
        style = MaterialTheme.typography.displayLarge,
        color = MaterialTheme.colorScheme.onBackground,
        fontWeight = FontWeight.Bold,
        modifier = modifier.padding(horizontal = 16.dp, vertical = 12.dp)
    )
}

data class StatusPalette(val background: Color, val foreground: Color, val label: String)

fun FertilityStatus.palette(): StatusPalette = when (this) {
    FertilityStatus.INFERTILE -> StatusPalette(StatusInfertileLight, StatusInfertileText, "Baja")
    FertilityStatus.FERTILE -> StatusPalette(StatusFertileLight, StatusFertileText, "Alta")
    FertilityStatus.PEAK -> StatusPalette(StatusPeakLight, StatusPeakText, "Máxima")
    FertilityStatus.MENSTRUATION -> StatusPalette(StatusMenstruationLight, StatusMenstruationText, "Menstruación")
    FertilityStatus.UNCERTAIN -> StatusPalette(StatusUncertainLight, StatusUncertainText, "Incierto")
}

@Composable
fun StatusPill(status: FertilityStatus, modifier: Modifier = Modifier) {
    val pal = status.palette()
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(pal.background)
            .padding(horizontal = 10.dp, vertical = 4.dp)
    ) {
        Text(
            text = pal.label,
            style = MaterialTheme.typography.labelMedium,
            color = pal.foreground,
            fontWeight = FontWeight.SemiBold
        )
    }
}
