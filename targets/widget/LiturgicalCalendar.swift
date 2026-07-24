import Foundation

// Ported 1:1 from src/services/liturgical/LiturgicalThemeService.ts.
// Keep the season enum, label wording, and intensity math identical to the
// TS source so the widget never disagrees with the app about today's season.

enum LiturgicalSeason: String {
    case advent
    case christmas
    case ordinaryTimeEarly = "ordinary-time-early"
    case lent
    case holyWeek = "holy-week"
    case easter
    case pentecost
    case ordinaryTime = "ordinary-time"
}

struct LiturgicalMoment {
    let season: LiturgicalSeason
    /// 0.0 (start of season) -> 1.0 (at the highpoint / end)
    let intensity: Double
    /// Human-readable label e.g. "Week 3 of Advent"
    let label: String
}

private let gregorian: Calendar = {
    var cal = Calendar(identifier: .gregorian)
    cal.timeZone = TimeZone.current
    return cal
}()

// MARK: - Easter calculation (Computus algorithm)

private func easterDate(year: Int) -> Date {
    let a = year % 19
    let b = year / 100
    let c = year % 100
    let d = b / 4
    let e = b % 4
    let f = (b + 8) / 25
    let g = (b - f + 1) / 3
    let h = (19 * a + b - d - g + 15) % 30
    let i = c / 4
    let k = c % 4
    let l = (32 + 2 * e + 2 * i - h - k) % 7
    let m = (a + 11 * h + 22 * l) / 451
    let month = (h + l - 7 * m + 114) / 31 // 1-based
    let day = ((h + l - 7 * m + 114) % 31) + 1
    return dateFrom(year: year, month: month, day: day)
}

private func dateFrom(year: Int, month: Int, day: Int) -> Date {
    var comps = DateComponents()
    comps.year = year
    comps.month = month
    comps.day = day
    return gregorian.date(from: comps)!
}

private func addDays(_ date: Date, _ days: Int) -> Date {
    gregorian.date(byAdding: .day, value: days, to: date)!
}

private func startOfDay(_ date: Date) -> Date {
    gregorian.startOfDay(for: date)
}

private func daysBetween(_ a: Date, _ b: Date) -> Int {
    gregorian.dateComponents([.day], from: startOfDay(a), to: startOfDay(b)).day ?? 0
}

private func clamp(_ value: Double, _ minV: Double, _ maxV: Double) -> Double {
    min(max(value, minV), maxV)
}

private func dayOfWeek(_ date: Date) -> Int {
    // Calendar.component(.weekday) is 1 = Sunday, matching JS's Date#getDay()
    gregorian.component(.weekday, from: date) - 1
}

// MARK: - Advent start: 4th Sunday before Christmas

private func adventStart(year: Int) -> Date {
    let christmas = dateFrom(year: year, month: 12, day: 25)
    let dow = dayOfWeek(christmas) // 0 = Sunday
    let daysToSunday = dow == 0 ? 0 : dow
    let fourthSundayBefore = addDays(christmas, -(daysToSunday + 21))
    return startOfDay(fourthSundayBefore)
}

// MARK: - Main entry point

func getLiturgicalMoment(date: Date = Date()) -> LiturgicalMoment {
    let today = startOfDay(date)
    let year = gregorian.component(.year, from: today)

    let easter = startOfDay(easterDate(year: year))
    let ashWednesday = addDays(easter, -46)
    let palmSunday = addDays(easter, -7)
    let pentecost = addDays(easter, 49)
    let advent = adventStart(year: year)
    let christmas = dateFrom(year: year, month: 12, day: 25)
    let baptismOfTheLord: Date = {
        let epiphany = dateFrom(year: year, month: 1, day: 6)
        let dow = dayOfWeek(epiphany)
        return dow == 0 ? dateFrom(year: year, month: 1, day: 13) : addDays(epiphany, 7 - dow)
    }()

    let prevChristmas = dateFrom(year: year - 1, month: 12, day: 25)

    // Advent (current year)
    if today >= advent && today < christmas {
        let total = daysBetween(advent, christmas)
        let elapsed = daysBetween(advent, today)
        let intensity = clamp(Double(elapsed) / Double(total), 0, 1)
        let weekNum = elapsed / 7 + 1
        return LiturgicalMoment(season: .advent, intensity: intensity, label: "Week \(weekNum) of Advent")
    }

    // Christmas (Dec 25 -> Baptism of the Lord) — sustained celebration, flat intensity
    if today >= christmas || today <= baptismOfTheLord {
        let elapsed = today >= christmas ? daysBetween(christmas, today) : daysBetween(prevChristmas, today)
        let dayNum = elapsed + 1
        return LiturgicalMoment(season: .christmas, intensity: 0.8, label: "Day \(dayNum) of Christmas")
    }

    // Lent
    if today >= ashWednesday && today < palmSunday {
        let total = daysBetween(ashWednesday, palmSunday)
        let elapsed = daysBetween(ashWednesday, today)
        let intensity = clamp(Double(elapsed) / Double(total), 0, 1)
        let weekNum = elapsed / 7 + 1
        return LiturgicalMoment(season: .lent, intensity: intensity, label: "Week \(weekNum) of Lent")
    }

    // Holy Week (Palm Sunday -> Holy Saturday)
    if today >= palmSunday && today < easter {
        let total = daysBetween(palmSunday, easter)
        let elapsed = daysBetween(palmSunday, today)
        let intensity = clamp(0.7 + (Double(elapsed) / Double(total)) * 0.3, 0.7, 1) // already intense, deepens to 1
        let days = ["Palm Sunday", "Monday of Holy Week", "Tuesday of Holy Week",
                    "Wednesday of Holy Week", "Holy Thursday", "Good Friday", "Holy Saturday"]
        let label = elapsed >= 0 && elapsed < days.count ? days[elapsed] : "Holy Week"
        return LiturgicalMoment(season: .holyWeek, intensity: intensity, label: label)
    }

    // Pentecost Sunday
    if daysBetween(today, pentecost) == 0 {
        return LiturgicalMoment(season: .pentecost, intensity: 1.0, label: "Pentecost Sunday")
    }

    // Easter (Easter Sunday -> Pentecost)
    if today >= easter && today < pentecost {
        let total = daysBetween(easter, pentecost)
        let elapsed = daysBetween(easter, today)
        let weekNum = elapsed / 7 + 1
        // Sustained joy (0.8) that builds to full intensity in the final week
        let intensity: Double = elapsed >= total - 7
            ? clamp(0.8 + (Double(elapsed - (total - 7)) / 7) * 0.2, 0.8, 1)
            : 0.8
        return LiturgicalMoment(season: .easter, intensity: intensity, label: "Week \(weekNum) of Easter")
    }

    // Ordinary Time — Early: Baptism of the Lord -> Ash Wednesday
    if today > baptismOfTheLord && today < ashWednesday {
        let elapsed = daysBetween(baptismOfTheLord, today)
        let weekNum = elapsed / 7 + 1
        return LiturgicalMoment(season: .ordinaryTimeEarly, intensity: 0.5, label: "Week \(weekNum) in Ordinary Time")
    }

    // Ordinary Time — Late: Pentecost -> Advent
    let elapsed = daysBetween(pentecost, today)
    let weekNum = elapsed / 7 + 1
    return LiturgicalMoment(season: .ordinaryTime, intensity: 0.5, label: "Week \(weekNum) in Ordinary Time")
}
