package com.readingdaily.scripture.widget

import java.util.Calendar
import java.util.GregorianCalendar
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min

// Ported 1:1 from src/services/liturgical/LiturgicalThemeService.ts (see the Swift port at
// targets/widget/LiturgicalCalendar.swift for the iOS equivalent). Keep the season set, label
// wording, and intensity math identical to the TS source so neither widget ever disagrees
// with the app about today's season.

enum class LiturgicalSeason(val id: String) {
    ADVENT("advent"),
    CHRISTMAS("christmas"),
    ORDINARY_TIME_EARLY("ordinary-time-early"),
    LENT("lent"),
    HOLY_WEEK("holy-week"),
    EASTER("easter"),
    PENTECOST("pentecost"),
    ORDINARY_TIME("ordinary-time"),
}

data class LiturgicalMoment(
    val season: LiturgicalSeason,
    /** 0.0 (start of season) -> 1.0 (at the highpoint / end) */
    val intensity: Double,
    /** Human-readable label e.g. "Week 3 of Advent" */
    val label: String,
)

private fun dateAt(year: Int, month1Based: Int, day: Int): Calendar {
    val cal = GregorianCalendar()
    cal.clear()
    cal.set(year, month1Based - 1, day, 0, 0, 0)
    return cal
}

private fun addDays(cal: Calendar, days: Int): Calendar {
    val result = cal.clone() as Calendar
    result.add(Calendar.DAY_OF_MONTH, days)
    return result
}

private fun startOfDay(cal: Calendar): Calendar {
    val result = cal.clone() as Calendar
    result.set(Calendar.HOUR_OF_DAY, 0)
    result.set(Calendar.MINUTE, 0)
    result.set(Calendar.SECOND, 0)
    result.set(Calendar.MILLISECOND, 0)
    return result
}

private fun daysBetween(a: Calendar, b: Calendar): Int {
    val msPerDay = 86400000L
    val diff = startOfDay(b).timeInMillis - startOfDay(a).timeInMillis
    return (diff / msPerDay).toInt()
}

private fun clamp(value: Double, minV: Double, maxV: Double): Double = min(max(value, minV), maxV)

/** Calendar.DAY_OF_WEEK is 1 = Sunday, matching JS's Date#getDay(). */
private fun dayOfWeek(cal: Calendar): Int = cal.get(Calendar.DAY_OF_WEEK) - 1

// Easter calculation (Computus algorithm)
private fun easterDate(year: Int): Calendar {
    val a = year % 19
    val b = year / 100
    val c = year % 100
    val d = b / 4
    val e = b % 4
    val f = (b + 8) / 25
    val g = (b - f + 1) / 3
    val h = (19 * a + b - d - g + 15) % 30
    val i = c / 4
    val k = c % 4
    val l = (32 + 2 * e + 2 * i - h - k) % 7
    val m = (a + 11 * h + 22 * l) / 451
    val month = (h + l - 7 * m + 114) / 31 // 1-based
    val day = ((h + l - 7 * m + 114) % 31) + 1
    return dateAt(year, month, day)
}

// Advent start: 4th Sunday before Christmas
private fun adventStart(year: Int): Calendar {
    val christmas = dateAt(year, 12, 25)
    val dow = dayOfWeek(christmas) // 0 = Sunday
    val daysToSunday = if (dow == 0) 0 else dow
    return startOfDay(addDays(christmas, -(daysToSunday + 21)))
}

fun getLiturgicalMoment(date: Calendar = GregorianCalendar()): LiturgicalMoment {
    val today = startOfDay(date)
    val year = today.get(Calendar.YEAR)

    val easter = startOfDay(easterDate(year))
    val ashWednesday = addDays(easter, -46)
    val palmSunday = addDays(easter, -7)
    val pentecost = addDays(easter, 49)
    val advent = adventStart(year)
    val christmas = dateAt(year, 12, 25)
    val baptismOfTheLord: Calendar = run {
        val epiphany = dateAt(year, 1, 6)
        val dow = dayOfWeek(epiphany)
        if (dow == 0) dateAt(year, 1, 13) else addDays(epiphany, 7 - dow)
    }
    val prevChristmas = dateAt(year - 1, 12, 25)

    // Advent (current year)
    if (today >= advent && today < christmas) {
        val total = daysBetween(advent, christmas)
        val elapsed = daysBetween(advent, today)
        val intensity = clamp(elapsed.toDouble() / total, 0.0, 1.0)
        val weekNum = elapsed / 7 + 1
        return LiturgicalMoment(LiturgicalSeason.ADVENT, intensity, "Week $weekNum of Advent")
    }

    // Christmas (Dec 25 -> Baptism of the Lord) — sustained celebration, flat intensity
    if (today >= christmas || today <= baptismOfTheLord) {
        val elapsed = if (today >= christmas) daysBetween(christmas, today) else daysBetween(prevChristmas, today)
        val dayNum = elapsed + 1
        return LiturgicalMoment(LiturgicalSeason.CHRISTMAS, 0.8, "Day $dayNum of Christmas")
    }

    // Lent
    if (today >= ashWednesday && today < palmSunday) {
        val total = daysBetween(ashWednesday, palmSunday)
        val elapsed = daysBetween(ashWednesday, today)
        val intensity = clamp(elapsed.toDouble() / total, 0.0, 1.0)
        val weekNum = elapsed / 7 + 1
        return LiturgicalMoment(LiturgicalSeason.LENT, intensity, "Week $weekNum of Lent")
    }

    // Holy Week (Palm Sunday -> Holy Saturday)
    if (today >= palmSunday && today < easter) {
        val total = daysBetween(palmSunday, easter)
        val elapsed = daysBetween(palmSunday, today)
        val intensity = clamp(0.7 + (elapsed.toDouble() / total) * 0.3, 0.7, 1.0)
        val days = listOf(
            "Palm Sunday", "Monday of Holy Week", "Tuesday of Holy Week",
            "Wednesday of Holy Week", "Holy Thursday", "Good Friday", "Holy Saturday"
        )
        val label = if (elapsed in days.indices) days[elapsed] else "Holy Week"
        return LiturgicalMoment(LiturgicalSeason.HOLY_WEEK, intensity, label)
    }

    // Pentecost Sunday
    if (daysBetween(today, pentecost) == 0) {
        return LiturgicalMoment(LiturgicalSeason.PENTECOST, 1.0, "Pentecost Sunday")
    }

    // Easter (Easter Sunday -> Pentecost)
    if (today >= easter && today < pentecost) {
        val total = daysBetween(easter, pentecost)
        val elapsed = daysBetween(easter, today)
        val weekNum = elapsed / 7 + 1
        val intensity = if (elapsed >= total - 7) {
            clamp(0.8 + ((elapsed - (total - 7)).toDouble() / 7) * 0.2, 0.8, 1.0)
        } else {
            0.8
        }
        return LiturgicalMoment(LiturgicalSeason.EASTER, intensity, "Week $weekNum of Easter")
    }

    // Ordinary Time — Early: Baptism of the Lord -> Ash Wednesday
    if (today > baptismOfTheLord && today < ashWednesday) {
        val elapsed = daysBetween(baptismOfTheLord, today)
        val weekNum = elapsed / 7 + 1
        return LiturgicalMoment(LiturgicalSeason.ORDINARY_TIME_EARLY, 0.5, "Week $weekNum in Ordinary Time")
    }

    // Ordinary Time — Late: Pentecost -> Advent
    val elapsed = daysBetween(pentecost, today)
    val weekNum = elapsed / 7 + 1
    return LiturgicalMoment(LiturgicalSeason.ORDINARY_TIME, 0.5, "Week $weekNum in Ordinary Time")
}

private operator fun Calendar.compareTo(other: Calendar): Int = this.timeInMillis.compareTo(other.timeInMillis)
