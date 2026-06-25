package com.example.fertilitytracker.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import androidx.lifecycle.ViewModelProvider.AndroidViewModelFactory.Companion.APPLICATION_KEY
import com.example.fertilitytracker.FertilityApp
import com.example.fertilitytracker.data.CervicalMucus
import com.example.fertilitytracker.data.CycleRepository
import com.example.fertilitytracker.data.DayEntry
import com.example.fertilitytracker.data.MenstruationFlow
import com.example.fertilitytracker.data.SettingsRepository
import com.example.fertilitytracker.domain.CycleAnalysis
import com.example.fertilitytracker.domain.CycleSettings
import com.example.fertilitytracker.domain.DayInsight
import com.example.fertilitytracker.domain.FertilityEngine
import com.example.fertilitytracker.domain.FertilityResult
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.YearMonth

data class CalendarUiState(
    val month: YearMonth = YearMonth.now(),
    val selectedDate: LocalDate = LocalDate.now(),
    val insights: Map<LocalDate, DayInsight> = emptyMap(),
    val entries: Map<LocalDate, DayEntry> = emptyMap(),
    val settings: CycleSettings = CycleSettings(),
    val activeCycle: CycleAnalysis? = null,
    val averageCycleLength: Int = CycleSettings.DEFAULT_CYCLE_LENGTH,
    val averageLutealLength: Int = CycleSettings.DEFAULT_LUTEAL_PHASE,
    val cyclesUsedForLuteal: Int = 0,
    val nextOvulation: LocalDate? = null,
    val nextPeriod: LocalDate? = null
)

@OptIn(ExperimentalCoroutinesApi::class)
class FertilityViewModel(
    private val cycleRepository: CycleRepository,
    private val settingsRepository: SettingsRepository
) : ViewModel() {

    private val _selectedDate = MutableStateFlow(LocalDate.now())
    val selectedDate: StateFlow<LocalDate> = _selectedDate.asStateFlow()

    private val _month = MutableStateFlow(YearMonth.now())
    val month: StateFlow<YearMonth> = _month.asStateFlow()

    val settings: StateFlow<CycleSettings> = settingsRepository.settings.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = CycleSettings()
    )

    private val cycleStarts = cycleRepository.observeCycleStarts().stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = emptyList()
    )

    private val allEntries = cycleRepository.observeAll().stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = emptyList()
    )

    /** Resultado completo del motor — cacheado tras cada cambio de datos. */
    private val fertilityResult: StateFlow<FertilityResult> = combine(
        cycleStarts, allEntries, settings
    ) { starts, entries, s ->
        FertilityEngine().analyze(
            cycleStarts = starts,
            entries = entries,
            defaultCycleLength = s.averageCycleLength,
            defaultLutealLength = s.lutealPhaseLength
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = FertilityResult(
            statusByDate = emptyMap(),
            analyses = emptyList(),
            averageCycleLength = CycleSettings.DEFAULT_CYCLE_LENGTH,
            averageLutealLength = CycleSettings.DEFAULT_LUTEAL_PHASE,
            shortestCycleLength = null,
            cyclesUsedForLuteal = 0
        )
    )

    val uiState: StateFlow<CalendarUiState> = combine(
        _month, _selectedDate, settings, allEntries, fertilityResult
    ) { month, selected, settings, entries, result ->
        val entriesByDate = entries.associateBy { it.localDate }
        val active = result.activeCycle

        val nextPeriod = active?.cycleStartDate?.plusDays(result.averageCycleLength.toLong())
        val nextOvulation = active?.estimatedOvulationDate
            ?.takeIf { !it.isBefore(LocalDate.now()) }
            ?: nextPeriod?.minusDays(result.averageLutealLength.toLong())

        CalendarUiState(
            month = month,
            selectedDate = selected,
            insights = result.statusByDate,
            entries = entriesByDate,
            settings = settings,
            activeCycle = active,
            averageCycleLength = result.averageCycleLength,
            averageLutealLength = result.averageLutealLength,
            cyclesUsedForLuteal = result.cyclesUsedForLuteal,
            nextOvulation = nextOvulation,
            nextPeriod = nextPeriod
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = CalendarUiState()
    )

    val selectedEntry: StateFlow<DayEntry?> = _selectedDate
        .flatMapLatest { cycleRepository.observeByDate(it) }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = null
        )

    val recentEntries: StateFlow<List<DayEntry>> = allEntries
        .map { list -> list.takeLast(60) }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = emptyList()
        )

    val activeAnalysis: StateFlow<CycleAnalysis?> = fertilityResult
        .map { it.activeCycle }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = null
        )

    fun selectDate(date: LocalDate) { _selectedDate.value = date }
    fun showMonth(month: YearMonth) { _month.value = month }

    fun saveEntry(
        date: LocalDate,
        basalTemperature: Double?,
        mucus: CervicalMucus,
        flow: MenstruationFlow,
        isCycleStart: Boolean,
        notes: String
    ) {
        viewModelScope.launch {
            cycleRepository.upsert(
                DayEntry(
                    date = date.toString(),
                    basalTemperature = basalTemperature,
                    cervicalMucus = mucus,
                    menstruationFlow = flow,
                    isCycleStart = isCycleStart,
                    notes = notes
                )
            )
        }
    }

    fun clearEntry(date: LocalDate) {
        viewModelScope.launch { cycleRepository.delete(date) }
    }

    fun updateCycleLength(days: Int) {
        viewModelScope.launch { settingsRepository.updateCycleLength(days) }
    }

    fun updatePeriodLength(days: Int) {
        viewModelScope.launch { settingsRepository.updatePeriodLength(days) }
    }

    fun updateLutealLength(days: Int) {
        viewModelScope.launch { settingsRepository.updateLutealLength(days) }
    }

    companion object {
        val Factory = viewModelFactory {
            initializer {
                val app = this[APPLICATION_KEY] as FertilityApp
                FertilityViewModel(app.cycleRepository, app.settingsRepository)
            }
        }
    }
}
