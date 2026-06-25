package com.example.fertilitytracker.ui.theme

import androidx.compose.ui.graphics.Color

// iOS-system-like neutral palette
val IosBackground = Color(0xFFF2F2F7)
val IosBackgroundDark = Color(0xFF000000)
val IosCard = Color(0xFFFFFFFF)
val IosCardDark = Color(0xFF1C1C1E)
val IosSeparator = Color(0xFFE5E5EA)
val IosSeparatorDark = Color(0xFF38383A)
val IosLabel = Color(0xFF1C1C1E)
val IosLabelDark = Color(0xFFF2F2F7)
val IosSecondary = Color(0xFF8E8E93)
val IosTertiary = Color(0xFFAEAEB2)

// Brand accents (iOS-system style)
val AccentRose = Color(0xFFFF375F)
val AccentRoseDark = Color(0xFFFF6482)
val AccentBlue = Color(0xFF007AFF)
val AccentTeal = Color(0xFF00897B)
val AccentMint = Color(0xFF00C7BE)
val AccentLavender = Color(0xFFAF52DE)
val AccentPurple = Color(0xFF7E1FB7)
val AccentOrange = Color(0xFFFF9500)
val AccentYellow = Color(0xFFFFCC00)

// Fertility status colors — paleta diferenciada visualmente:
//  - MENSTRUACIÓN: rojo profundo
//  - INFERTILE: verde menta (calma, "vía libre" en sentido NFP)
//  - FERTILE: ámbar (precaución)
//  - PEAK: violeta intenso (alerta máxima, contraste fuerte con menstruación)
//  - UNCERTAIN: gris neutro
val StatusInfertileLight = Color(0xFFD7F1E5)
val StatusInfertileText  = Color(0xFF00875A)

val StatusFertileLight   = Color(0xFFFFE9B0)
val StatusFertileText    = Color(0xFFB95E00)

val StatusPeakLight      = Color(0xFFE6D6F8)
val StatusPeakText       = Color(0xFF6516B0)

val StatusMenstruationLight = Color(0xFFFFC1C1)
val StatusMenstruationText  = Color(0xFFB00020)

val StatusUncertainLight = Color(0xFFE5E5EA)
val StatusUncertainText  = Color(0xFF6C6C70)
