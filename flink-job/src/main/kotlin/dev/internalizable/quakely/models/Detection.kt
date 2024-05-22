package dev.internalizable.quakely.models

import kotlinx.serialization.Serializable

/**
 * @author GrowlyX
 * @since 5/21/2024
 */
@Serializable
data class Detection(
    val latitude: Double,
    val longitude: Double,
    val deltaX: Double,
    val deltaY: Double,
    val timestamp: Long
)
