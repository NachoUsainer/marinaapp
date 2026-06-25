package com.example.fertilitytracker.domain

data class CycleSettings(
    val averageCycleLength: Int = DEFAULT_CYCLE_LENGTH,
    val averagePeriodLength: Int = DEFAULT_PERIOD_LENGTH,
    val lutealPhaseLength: Int = DEFAULT_LUTEAL_PHASE
) {
    companion object {
        const val DEFAULT_CYCLE_LENGTH = 28
        const val DEFAULT_PERIOD_LENGTH = 5
        const val DEFAULT_LUTEAL_PHASE = 14
        const val MIN_CYCLE_LENGTH = 21
        const val MAX_CYCLE_LENGTH = 40
    }
}
