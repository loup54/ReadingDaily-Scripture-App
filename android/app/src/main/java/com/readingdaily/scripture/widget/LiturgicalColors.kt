package com.readingdaily.scripture.widget

import android.graphics.Color

// Ported 1:1 from src/constants/colors.ts (liturgicalSeasonBase + getLiturgicalTheme + lerpHex).
// Keep hex values identical to the TS/Swift sources so all three widgets/app agree on colour.

data class LiturgicalSeasonTheme(
    val backgroundTop: Int,
    val backgroundBottom: Int,
    val accent: Int,
    val labelColor: Int,
)

private data class ThemeHex(val backgroundTop: String, val backgroundBottom: String, val accent: String, val labelColor: String)
private data class SeasonPair(val base: ThemeHex, val peak: ThemeHex)

private val liturgicalSeasonBase = mapOf(
    LiturgicalSeason.ADVENT to SeasonPair(
        base = ThemeHex("#2D1B4E", "#1A1035", "#7B5EA7", "#C4A8E0"),
        peak = ThemeHex("#4A1B7A", "#2D0D5C", "#B088E8", "#E0CCFF"),
    ),
    LiturgicalSeason.CHRISTMAS to SeasonPair(
        base = ThemeHex("#1A3A1A", "#0F2A1A", "#C9A227", "#F0C040"),
        peak = ThemeHex("#1A3A1A", "#0F2A1A", "#C9A227", "#F0C040"),
    ),
    LiturgicalSeason.LENT to SeasonPair(
        base = ThemeHex("#2A2030", "#1A1525", "#7A5C7A", "#B89AB8"),
        peak = ThemeHex("#3A1515", "#250A0A", "#8B2020", "#C84848"),
    ),
    LiturgicalSeason.HOLY_WEEK to SeasonPair(
        base = ThemeHex("#3A1515", "#250A0A", "#8B2020", "#C84848"),
        peak = ThemeHex("#1A0505", "#0D0000", "#6B0000", "#A82828"),
    ),
    LiturgicalSeason.EASTER to SeasonPair(
        base = ThemeHex("#1A3A20", "#0F2515", "#C9A227", "#E8C840"),
        peak = ThemeHex("#2A1500", "#1A0D00", "#E05C10", "#FF9050"),
    ),
    LiturgicalSeason.PENTECOST to SeasonPair(
        base = ThemeHex("#3A1500", "#250900", "#E05C10", "#FF9050"),
        peak = ThemeHex("#3A1500", "#250900", "#E05C10", "#FF9050"),
    ),
    LiturgicalSeason.ORDINARY_TIME to SeasonPair(
        base = ThemeHex("#1A2A1A", "#101D10", "#4A7A4A", "#7ABE7A"),
        peak = ThemeHex("#1A2A1A", "#101D10", "#4A7A4A", "#7ABE7A"),
    ),
    LiturgicalSeason.ORDINARY_TIME_EARLY to SeasonPair(
        base = ThemeHex("#1A2A1A", "#101D10", "#4A7A4A", "#7ABE7A"),
        peak = ThemeHex("#1A2A1A", "#101D10", "#4A7A4A", "#7ABE7A"),
    ),
)

private fun lerpHex(a: String, b: String, t: Double): Int {
    val ac = Color.parseColor(a)
    val bc = Color.parseColor(b)
    val r = (Color.red(ac) + (Color.red(bc) - Color.red(ac)) * t).toInt()
    val g = (Color.green(ac) + (Color.green(bc) - Color.green(ac)) * t).toInt()
    val bl = (Color.blue(ac) + (Color.blue(bc) - Color.blue(ac)) * t).toInt()
    return Color.rgb(r, g, bl)
}

fun getLiturgicalTheme(season: LiturgicalSeason, intensity: Double): LiturgicalSeasonTheme {
    val pair = liturgicalSeasonBase[season] ?: liturgicalSeasonBase[LiturgicalSeason.ORDINARY_TIME]!!
    val t = intensity.coerceIn(0.0, 1.0)

    return LiturgicalSeasonTheme(
        backgroundTop = lerpHex(pair.base.backgroundTop, pair.peak.backgroundTop, t),
        backgroundBottom = lerpHex(pair.base.backgroundBottom, pair.peak.backgroundBottom, t),
        accent = lerpHex(pair.base.accent, pair.peak.accent, t),
        labelColor = lerpHex(pair.base.labelColor, pair.peak.labelColor, t),
    )
}
