import SwiftUI

// Ported 1:1 from src/constants/colors.ts (liturgicalSeasonBase + getLiturgicalTheme + lerpHex).
// Keep hex values identical to the TS source so the widget's colour accent
// always matches what the app itself would show for the same season/intensity.

struct LiturgicalSeasonTheme {
    let backgroundGradient: (String, String)
    let accent: String
    let labelColor: String
}

private struct SeasonPair {
    let base: LiturgicalSeasonTheme
    let peak: LiturgicalSeasonTheme
}

private let liturgicalSeasonBase: [LiturgicalSeason: SeasonPair] = [
    .advent: SeasonPair(
        base: LiturgicalSeasonTheme(backgroundGradient: ("#2D1B4E", "#1A1035"), accent: "#7B5EA7", labelColor: "#C4A8E0"),
        peak: LiturgicalSeasonTheme(backgroundGradient: ("#4A1B7A", "#2D0D5C"), accent: "#B088E8", labelColor: "#E0CCFF")
    ),
    .christmas: SeasonPair(
        base: LiturgicalSeasonTheme(backgroundGradient: ("#1A3A1A", "#0F2A1A"), accent: "#C9A227", labelColor: "#F0C040"),
        peak: LiturgicalSeasonTheme(backgroundGradient: ("#1A3A1A", "#0F2A1A"), accent: "#C9A227", labelColor: "#F0C040")
    ),
    .lent: SeasonPair(
        base: LiturgicalSeasonTheme(backgroundGradient: ("#2A2030", "#1A1525"), accent: "#7A5C7A", labelColor: "#B89AB8"),
        peak: LiturgicalSeasonTheme(backgroundGradient: ("#3A1515", "#250A0A"), accent: "#8B2020", labelColor: "#C84848")
    ),
    .holyWeek: SeasonPair(
        base: LiturgicalSeasonTheme(backgroundGradient: ("#3A1515", "#250A0A"), accent: "#8B2020", labelColor: "#C84848"),
        peak: LiturgicalSeasonTheme(backgroundGradient: ("#1A0505", "#0D0000"), accent: "#6B0000", labelColor: "#A82828")
    ),
    .easter: SeasonPair(
        base: LiturgicalSeasonTheme(backgroundGradient: ("#1A3A20", "#0F2515"), accent: "#C9A227", labelColor: "#E8C840"),
        peak: LiturgicalSeasonTheme(backgroundGradient: ("#2A1500", "#1A0D00"), accent: "#E05C10", labelColor: "#FF9050")
    ),
    .pentecost: SeasonPair(
        base: LiturgicalSeasonTheme(backgroundGradient: ("#3A1500", "#250900"), accent: "#E05C10", labelColor: "#FF9050"),
        peak: LiturgicalSeasonTheme(backgroundGradient: ("#3A1500", "#250900"), accent: "#E05C10", labelColor: "#FF9050")
    ),
    .ordinaryTime: SeasonPair(
        base: LiturgicalSeasonTheme(backgroundGradient: ("#1A2A1A", "#101D10"), accent: "#4A7A4A", labelColor: "#7ABE7A"),
        peak: LiturgicalSeasonTheme(backgroundGradient: ("#1A2A1A", "#101D10"), accent: "#4A7A4A", labelColor: "#7ABE7A")
    ),
    .ordinaryTimeEarly: SeasonPair(
        base: LiturgicalSeasonTheme(backgroundGradient: ("#1A2A1A", "#101D10"), accent: "#4A7A4A", labelColor: "#7ABE7A"),
        peak: LiturgicalSeasonTheme(backgroundGradient: ("#1A2A1A", "#101D10"), accent: "#4A7A4A", labelColor: "#7ABE7A")
    ),
]

/// Lerp a hex colour between two values — used for intensity transitions.
private func lerpHex(_ a: String, _ b: String, _ t: Double) -> String {
    let ah = Int(a.dropFirst(), radix: 16) ?? 0
    let bh = Int(b.dropFirst(), radix: 16) ?? 0
    let ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff
    let br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff
    let rr = Int((Double(ar) + Double(br - ar) * t).rounded())
    let rg = Int((Double(ag) + Double(bg - ag) * t).rounded())
    let rb = Int((Double(ab) + Double(bb - ab) * t).rounded())
    return String(format: "#%02X%02X%02X", rr, rg, rb)
}

/// Returns the interpolated liturgical theme for the given season and intensity.
/// intensity: 0.0 = start of season, 1.0 = highpoint.
func getLiturgicalTheme(season: LiturgicalSeason, intensity: Double) -> LiturgicalSeasonTheme {
    let pair = liturgicalSeasonBase[season] ?? liturgicalSeasonBase[.ordinaryTime]!
    let t = min(1, max(0, intensity))

    return LiturgicalSeasonTheme(
        backgroundGradient: (
            lerpHex(pair.base.backgroundGradient.0, pair.peak.backgroundGradient.0, t),
            lerpHex(pair.base.backgroundGradient.1, pair.peak.backgroundGradient.1, t)
        ),
        accent: lerpHex(pair.base.accent, pair.peak.accent, t),
        labelColor: lerpHex(pair.base.labelColor, pair.peak.labelColor, t)
    )
}

extension Color {
    init(hex: String) {
        let scanner = Scanner(string: hex.trimmingCharacters(in: CharacterSet(charactersIn: "#")))
        var rgb: UInt64 = 0
        scanner.scanHexInt64(&rgb)
        self.init(
            red: Double((rgb >> 16) & 0xff) / 255,
            green: Double((rgb >> 8) & 0xff) / 255,
            blue: Double(rgb & 0xff) / 255
        )
    }
}
