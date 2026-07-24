package com.readingdaily.scripture.widget

import android.content.Context
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.util.TimeZone

// Mirrors the JSON payload written by src/services/widget/WidgetDataService.ts via
// WidgetDataModule into plain SharedPreferences (Android has no App Group equivalent —
// widgets run in the same app process/sandbox, so this is directly readable, unlike iOS).

const val WIDGET_PREFS_NAME = "widget_data"
const val WIDGET_DATA_KEY = "todayReading"

data class SharedReadingData(
    val date: String,
    val seasonLabel: String,
    val accent: String,
    val labelColor: String,
    val backgroundGradientTop: String,
    val backgroundGradientBottom: String,
    val firstReadingTitle: String,
    val firstReadingReference: String,
    val firstReadingExcerpt: String,
)

fun readSharedReadingData(context: Context): SharedReadingData? {
    val prefs = context.getSharedPreferences(WIDGET_PREFS_NAME, Context.MODE_PRIVATE)
    val json = prefs.getString(WIDGET_DATA_KEY, null) ?: return null
    return try {
        val obj = JSONObject(json)
        SharedReadingData(
            date = obj.getString("date"),
            seasonLabel = obj.getString("seasonLabel"),
            accent = obj.getString("accent"),
            labelColor = obj.getString("labelColor"),
            backgroundGradientTop = obj.getString("backgroundGradientTop"),
            backgroundGradientBottom = obj.getString("backgroundGradientBottom"),
            firstReadingTitle = obj.getString("firstReadingTitle"),
            firstReadingReference = obj.getString("firstReadingReference"),
            firstReadingExcerpt = obj.getString("firstReadingExcerpt"),
        )
    } catch (e: Exception) {
        null
    }
}

/**
 * True when the shared payload's `date` (ISO 8601, UTC) matches today's local date —
 * guards against showing yesterday's reading if the app hasn't been opened yet today.
 */
fun isSharedReadingDataFresh(shared: SharedReadingData, now: Calendar): Boolean {
    val isoFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
        timeZone = TimeZone.getTimeZone("UTC")
    }
    val sharedDate: Date = try {
        isoFormat.parse(shared.date)
    } catch (e: Exception) {
        return false
    } ?: return false

    val sharedCal = Calendar.getInstance()
    sharedCal.time = sharedDate

    return sharedCal.get(Calendar.YEAR) == now.get(Calendar.YEAR) &&
        sharedCal.get(Calendar.DAY_OF_YEAR) == now.get(Calendar.DAY_OF_YEAR)
}
