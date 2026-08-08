package de.chemielernen.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// Brand colors from chemie-lernen.org (manifest theme_color #2d6a4f)
val BrandGreen = Color(0xFF2D6A4F)
val BrandGreenDark = Color(0xFF1B4332)
val BrandGreenLight = Color(0xFF95D5B2)
val BrandBackground = Color(0xFFF7F9F7)
val BrandOnBackground = Color(0xFF1B1F1D)

private val LightColors = lightColorScheme(
    primary = BrandGreen,
    onPrimary = Color.White,
    primaryContainer = BrandGreenLight,
    onPrimaryContainer = BrandGreenDark,
    secondary = Color(0xFF52796F),
    onSecondary = Color.White,
    background = BrandBackground,
    onBackground = BrandOnBackground,
    surface = Color.White,
    onSurface = BrandOnBackground,
)

private val DarkColors = darkColorScheme(
    primary = BrandGreenLight,
    onPrimary = BrandGreenDark,
    primaryContainer = BrandGreenDark,
    onPrimaryContainer = BrandGreenLight,
    secondary = Color(0xFF84A98C),
    background = Color(0xFF121513),
    onBackground = Color(0xFFE8EAE8),
    surface = Color(0xFF1B1F1D),
    onSurface = Color(0xFFE8EAE8),
)

@Composable
fun ChemieLernenTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        content = content,
    )
}