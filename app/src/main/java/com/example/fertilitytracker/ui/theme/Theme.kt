package com.example.fertilitytracker.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val LightColors = lightColorScheme(
    primary = AccentRose,
    onPrimary = IosCard,
    secondary = AccentBlue,
    onSecondary = IosCard,
    tertiary = AccentLavender,
    background = IosBackground,
    onBackground = IosLabel,
    surface = IosCard,
    onSurface = IosLabel,
    surfaceVariant = IosBackground,
    onSurfaceVariant = IosSecondary,
    outline = IosSeparator,
    outlineVariant = IosSeparator
)

private val DarkColors = darkColorScheme(
    primary = AccentRoseDark,
    onPrimary = IosCardDark,
    secondary = AccentBlue,
    onSecondary = IosLabelDark,
    tertiary = AccentLavender,
    background = IosBackgroundDark,
    onBackground = IosLabelDark,
    surface = IosCardDark,
    onSurface = IosLabelDark,
    surfaceVariant = IosCardDark,
    onSurfaceVariant = IosTertiary,
    outline = IosSeparatorDark,
    outlineVariant = IosSeparatorDark
)

@Composable
fun FertilityTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        typography = IosTypography,
        shapes = IosShapes,
        content = content
    )
}
