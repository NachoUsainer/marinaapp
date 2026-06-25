package com.example.fertilitytracker.data

/**
 * Calidad del moco cervical clasificada según Sensiplan (categorías S/S+).
 *
 * - NONE / DRY: no fértil (categoría "t").
 * - STICKY: bajo nivel de fertilidad (categoría "S").
 * - CREAMY / WATERY: signos de fertilidad real (categoría "S+").
 * - EGG_WHITE: signo máximo de fertilidad — define el "Día Pico".
 */
enum class CervicalMucus(val label: String, val sensiplanLevel: Int, val fertilityScore: Int) {
    NONE("Sin registro", 0, 0),
    DRY("Seco", 0, 1),
    STICKY("Pegajoso", 1, 2),
    CREAMY("Cremoso", 2, 3),
    WATERY("Acuoso", 2, 4),
    EGG_WHITE("Elástico (clara de huevo)", 3, 5);

    /** ¿Es moco fértil (categoría S+ o pico)? */
    val isFertile: Boolean get() = sensiplanLevel >= 2

    /** ¿Es el moco máximo (define el Día Pico)? */
    val isPeak: Boolean get() = sensiplanLevel == 3
}
