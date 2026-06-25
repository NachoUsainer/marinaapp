package com.example.fertilitytracker.data

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.time.LocalDate

/**
 * Registro diario del usuario.
 * La PK es la fecha en formato ISO ("YYYY-MM-DD") — un único registro por día.
 */
@Entity(tableName = "day_entries")
data class DayEntry(
    @PrimaryKey
    val date: String,
    val basalTemperature: Double? = null,
    val cervicalMucus: CervicalMucus = CervicalMucus.NONE,
    val menstruationFlow: MenstruationFlow = MenstruationFlow.NONE,
    val isCycleStart: Boolean = false,
    val notes: String = ""
) {
    val localDate: LocalDate get() = LocalDate.parse(date)

    companion object {
        fun forDate(date: LocalDate) = DayEntry(date = date.toString())
    }
}
