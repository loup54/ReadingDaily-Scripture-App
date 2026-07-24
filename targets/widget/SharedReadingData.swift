import Foundation

// Mirrors the JSON payload written by src/services/widget/WidgetDataService.ts
// into the shared App Group. Best-effort: nil if the app has never run since
// install, or the App Group hasn't synced yet — callers should fall back to
// the on-device liturgical calendar computation (no network needed either way).

private let appGroup = "group.com.readingdaily.scripture"
private let storageKey = "todayReading"

struct SharedReadingData: Decodable {
    let date: String
    let seasonLabel: String
    let accent: String
    let labelColor: String
    let backgroundGradientTop: String
    let backgroundGradientBottom: String
    let firstReadingTitle: String
    let firstReadingReference: String
    let firstReadingExcerpt: String
}

func readSharedReadingData() -> SharedReadingData? {
    guard let defaults = UserDefaults(suiteName: appGroup),
          let json = defaults.string(forKey: storageKey),
          let data = json.data(using: .utf8) else {
        return nil
    }
    return try? JSONDecoder().decode(SharedReadingData.self, from: data)
}

/// True when the shared payload's `date` matches today's local date —
/// guards against showing yesterday's reading if the app hasn't been
/// opened yet today.
func isSharedReadingDataFresh(_ shared: SharedReadingData, comparedTo date: Date) -> Bool {
    let isoFormatter = ISO8601DateFormatter()
    isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    guard let sharedDate = isoFormatter.date(from: shared.date) ?? {
        isoFormatter.formatOptions = [.withInternetDateTime]
        return isoFormatter.date(from: shared.date)
    }() else {
        return false
    }
    return Calendar.current.isDate(sharedDate, inSameDayAs: date)
}
