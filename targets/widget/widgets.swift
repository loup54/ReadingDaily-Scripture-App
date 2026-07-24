import WidgetKit
import SwiftUI

struct LiturgicalEntry: TimelineEntry {
    let date: Date
    let moment: LiturgicalMoment
    let theme: LiturgicalSeasonTheme
    /// Present only when the main app has run today and mirrored a reading
    /// into the shared App Group. Medium/large layouts use it; small never needs it.
    let shared: SharedReadingData?
}

struct Provider: TimelineProvider {
    private func makeEntry(for date: Date) -> LiturgicalEntry {
        let moment = getLiturgicalMoment(date: date)
        let theme = getLiturgicalTheme(season: moment.season, intensity: moment.intensity)
        let shared = readSharedReadingData().flatMap { isSharedReadingDataFresh($0, comparedTo: date) ? $0 : nil }
        return LiturgicalEntry(date: date, moment: moment, theme: theme, shared: shared)
    }

    func placeholder(in context: Context) -> LiturgicalEntry {
        makeEntry(for: Date())
    }

    func getSnapshot(in context: Context, completion: @escaping (LiturgicalEntry) -> Void) {
        completion(makeEntry(for: Date()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<LiturgicalEntry>) -> Void) {
        let now = Date()
        let entry = makeEntry(for: now)

        // Season/label only change at local midnight; the shared reading mirror
        // updates whenever the app runs and calls ExtensionStorage.reloadWidget(),
        // which triggers its own immediate timeline reload outside this policy.
        let calendar = Calendar.current
        let nextMidnight = calendar.nextDate(
            after: now,
            matching: DateComponents(hour: 0, minute: 0, second: 0),
            matchingPolicy: .nextTime
        ) ?? calendar.date(byAdding: .day, value: 1, to: now)!

        completion(Timeline(entries: [entry], policy: .after(nextMidnight)))
    }
}

private let dateFormatter: DateFormatter = {
    let formatter = DateFormatter()
    formatter.dateFormat = "EEE, MMM d"
    return formatter
}()

struct WidgetEntryView: View {
    @Environment(\.widgetFamily) private var family
    var entry: Provider.Entry

    var body: some View {
        switch family {
        case .systemMedium:
            mediumView
        case .systemLarge:
            largeView
        default:
            smallView
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(dateFormatter.string(from: entry.date))
                .font(.caption)
                .foregroundColor(.white.opacity(0.7))
            Text(entry.moment.label)
                .font(.headline)
                .foregroundColor(Color(hex: entry.theme.labelColor))
                .lineLimit(2)
                .minimumScaleFactor(0.7)
        }
    }

    private var smallView: some View {
        VStack(alignment: .leading, spacing: 4) {
            Spacer()
            header
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .padding()
        .containerBackground(for: .widget) { background }
        .widgetURL(URL(string: "readingdaily://"))
    }

    private var mediumView: some View {
        HStack(alignment: .top) {
            header
            Spacer()
            if let shared = entry.shared {
                VStack(alignment: .leading, spacing: 2) {
                    Text(shared.firstReadingReference)
                        .font(.caption2)
                        .foregroundColor(.white.opacity(0.6))
                    Text(shared.firstReadingExcerpt)
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.9))
                        .lineLimit(4)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            } else {
                Text("Open the app to sync today's reading")
                    .font(.caption2)
                    .foregroundColor(.white.opacity(0.6))
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .padding()
        .containerBackground(for: .widget) { background }
        .widgetURL(URL(string: "readingdaily://"))
    }

    private var largeView: some View {
        VStack(alignment: .leading, spacing: 8) {
            header
            Divider().background(Color.white.opacity(0.2))
            if let shared = entry.shared {
                Text(shared.firstReadingTitle)
                    .font(.subheadline).bold()
                    .foregroundColor(.white)
                Text(shared.firstReadingReference)
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.6))
                Text(shared.firstReadingExcerpt)
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.9))
                    .lineLimit(8)
                Spacer()
                Link(destination: URL(string: "readingdaily:///readings?action=listen")!) {
                    Text("▶ Listen")
                        .font(.caption2).bold()
                        .foregroundColor(Color(hex: entry.theme.accent))
                }
            } else {
                Spacer()
                Text("Open the app to sync today's reading")
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.6))
                Spacer()
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .padding()
        .containerBackground(for: .widget) { background }
        .widgetURL(URL(string: "readingdaily://"))
    }

    private var background: some View {
        LinearGradient(
            colors: [Color(hex: entry.theme.backgroundGradient.0), Color(hex: entry.theme.backgroundGradient.1)],
            startPoint: .top,
            endPoint: .bottom
        )
    }
}

struct ReadingDailyWidget: Widget {
    let kind: String = "ReadingDailyWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            WidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Today's Reading")
        .description("Shows today's date, liturgical season, and a preview of today's reading.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

@available(iOS 17.0, *)
#Preview(as: .systemMedium) {
    ReadingDailyWidget()
} timeline: {
    let moment = getLiturgicalMoment(date: .now)
    let theme = getLiturgicalTheme(season: moment.season, intensity: moment.intensity)
    LiturgicalEntry(date: .now, moment: moment, theme: theme, shared: nil)
}
