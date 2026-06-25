package com.example.fertilitytracker.domain

/**
 * Estado de fertilidad diario según método sintotérmico (Sensiplan).
 *
 * - INFERTILE: día seguro (pre-Döring o post-confirmación doble).
 * - FERTILE: ventana fértil abierta (Döring abierto, sin pico ni confirmación temp).
 * - PEAK: fertilidad máxima (Día Pico ± días contemplados).
 * - UNCERTAIN: ciclo desviado >20% del promedio o datos insuficientes.
 * - MENSTRUATION: días con sangrado.
 */
enum class FertilityStatus {
    INFERTILE,
    FERTILE,
    PEAK,
    UNCERTAIN,
    MENSTRUATION
}
