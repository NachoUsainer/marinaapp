package com.example.fertilitytracker.data

import androidx.room.TypeConverter

class Converters {
    @TypeConverter
    fun fromCervicalMucus(value: CervicalMucus): String = value.name

    @TypeConverter
    fun toCervicalMucus(value: String): CervicalMucus =
        runCatching { CervicalMucus.valueOf(value) }.getOrDefault(CervicalMucus.NONE)

    @TypeConverter
    fun fromMenstruationFlow(value: MenstruationFlow): String = value.name

    @TypeConverter
    fun toMenstruationFlow(value: String): MenstruationFlow =
        runCatching { MenstruationFlow.valueOf(value) }.getOrDefault(MenstruationFlow.NONE)
}
