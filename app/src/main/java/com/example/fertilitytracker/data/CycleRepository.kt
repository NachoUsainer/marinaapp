package com.example.fertilitytracker.data

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.time.LocalDate

class CycleRepository(private val dao: DayEntryDao) {

    fun observeAll(): Flow<List<DayEntry>> = dao.observeAll()

    fun observeRange(from: LocalDate, to: LocalDate): Flow<List<DayEntry>> =
        dao.observeRange(from.toString(), to.toString())

    fun observeByDate(date: LocalDate): Flow<DayEntry?> =
        dao.observeByDate(date.toString())

    fun observeCycleStarts(): Flow<List<LocalDate>> =
        dao.observeCycleStarts().map { list -> list.map { it.localDate } }

    suspend fun get(date: LocalDate): DayEntry? = dao.getByDate(date.toString())

    suspend fun upsert(entry: DayEntry) = dao.upsert(entry)

    suspend fun delete(date: LocalDate) = dao.deleteByDate(date.toString())
}
