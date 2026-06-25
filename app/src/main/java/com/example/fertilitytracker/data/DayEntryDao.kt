package com.example.fertilitytracker.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface DayEntryDao {

    @Query("SELECT * FROM day_entries ORDER BY date ASC")
    fun observeAll(): Flow<List<DayEntry>>

    @Query("SELECT * FROM day_entries WHERE date BETWEEN :from AND :to ORDER BY date ASC")
    fun observeRange(from: String, to: String): Flow<List<DayEntry>>

    @Query("SELECT * FROM day_entries WHERE date = :date LIMIT 1")
    suspend fun getByDate(date: String): DayEntry?

    @Query("SELECT * FROM day_entries WHERE date = :date LIMIT 1")
    fun observeByDate(date: String): Flow<DayEntry?>

    @Query("SELECT * FROM day_entries WHERE isCycleStart = 1 ORDER BY date ASC")
    fun observeCycleStarts(): Flow<List<DayEntry>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(entry: DayEntry)

    @Query("DELETE FROM day_entries WHERE date = :date")
    suspend fun deleteByDate(date: String)
}
