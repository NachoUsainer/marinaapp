package com.example.fertilitytracker.data

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.example.fertilitytracker.domain.CycleSettings
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.settingsDataStore by preferencesDataStore(name = "cycle_settings")

class SettingsRepository(private val context: Context) {

    private val cycleLengthKey = intPreferencesKey("cycle_length")
    private val periodLengthKey = intPreferencesKey("period_length")
    private val lutealLengthKey = intPreferencesKey("luteal_length")

    val settings: Flow<CycleSettings> = context.settingsDataStore.data.map { prefs ->
        CycleSettings(
            averageCycleLength = prefs[cycleLengthKey] ?: CycleSettings.DEFAULT_CYCLE_LENGTH,
            averagePeriodLength = prefs[periodLengthKey] ?: CycleSettings.DEFAULT_PERIOD_LENGTH,
            lutealPhaseLength = prefs[lutealLengthKey] ?: CycleSettings.DEFAULT_LUTEAL_PHASE
        )
    }

    suspend fun updateCycleLength(days: Int) {
        context.settingsDataStore.edit { prefs ->
            prefs[cycleLengthKey] = days.coerceIn(
                CycleSettings.MIN_CYCLE_LENGTH,
                CycleSettings.MAX_CYCLE_LENGTH
            )
        }
    }

    suspend fun updatePeriodLength(days: Int) {
        context.settingsDataStore.edit { prefs ->
            prefs[periodLengthKey] = days.coerceIn(2, 10)
        }
    }

    suspend fun updateLutealLength(days: Int) {
        context.settingsDataStore.edit { prefs ->
            prefs[lutealLengthKey] = days.coerceIn(10, 16)
        }
    }
}
