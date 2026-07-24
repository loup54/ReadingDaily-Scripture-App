package com.readingdaily.scripture.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews
import com.readingdaily.scripture.R
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

class ReadingWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (appWidgetId in appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId)
        }
    }

    companion object {
        private val dateFormatter = SimpleDateFormat("EEE, MMM d", Locale.US)

        fun updateAll(context: Context) {
            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(
                android.content.ComponentName(context, ReadingWidgetProvider::class.java)
            )
            for (id in ids) {
                updateWidget(context, manager, id)
            }
        }

        private fun updateWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
            val now = Calendar.getInstance()
            val moment = getLiturgicalMoment(now)
            val theme = getLiturgicalTheme(moment.season, moment.intensity)
            val shared = readSharedReadingData(context)?.takeIf { isSharedReadingDataFresh(it, now) }

            val views = RemoteViews(context.packageName, R.layout.widget_reading)
            views.setInt(R.id.widget_root, "setBackgroundColor", theme.backgroundBottom)
            views.setTextViewText(R.id.widget_date, dateFormatter.format(now.time))
            views.setTextViewText(R.id.widget_season_label, moment.label)
            views.setTextColor(R.id.widget_season_label, theme.labelColor)

            if (shared != null) {
                views.setTextViewText(R.id.widget_reading_reference, shared.firstReadingReference)
                views.setTextViewText(R.id.widget_reading_excerpt, shared.firstReadingExcerpt)
                views.setViewVisibility(R.id.widget_listen_button, android.view.View.VISIBLE)
                views.setTextColor(R.id.widget_listen_button, theme.accent)
                views.setOnClickPendingIntent(R.id.widget_listen_button, listenPendingIntent(context, appWidgetId))
            } else {
                views.setTextViewText(R.id.widget_reading_reference, "")
                views.setTextViewText(R.id.widget_reading_excerpt, "Open the app to sync today's reading")
                views.setViewVisibility(R.id.widget_listen_button, android.view.View.GONE)
            }

            views.setOnClickPendingIntent(R.id.widget_root, openPendingIntent(context, appWidgetId))
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }

        private fun openPendingIntent(context: Context, appWidgetId: Int): PendingIntent {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("readingdaily:///readings"))
            return PendingIntent.getActivity(
                context, appWidgetId, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
        }

        private fun listenPendingIntent(context: Context, appWidgetId: Int): PendingIntent {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("readingdaily:///readings?action=listen"))
            return PendingIntent.getActivity(
                context, appWidgetId + 100000, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
        }
    }
}
