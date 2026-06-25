package com.example.fertilitytracker

import android.app.Application
import com.example.fertilitytracker.data.AppDatabase
import com.example.fertilitytracker.data.CycleRepository
import com.example.fertilitytracker.data.SettingsRepository

class FertilityApp : Application() {

    val cycleRepository: CycleRepository by lazy {
        CycleRepository(AppDatabase.get(this).dayEntryDao())
    }

    val settingsRepository: SettingsRepository by lazy {
        SettingsRepository(this)
    }
}
