package com.readingdaily.scripture.widget

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class WidgetDataModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "WidgetDataModule"

    @ReactMethod
    fun set(key: String, value: String) {
        val prefs = reactApplicationContext.getSharedPreferences(WIDGET_PREFS_NAME, android.content.Context.MODE_PRIVATE)
        prefs.edit().putString(key, value).apply()
    }

    @ReactMethod
    fun reloadWidget() {
        ReadingWidgetProvider.updateAll(reactApplicationContext)
    }
}
