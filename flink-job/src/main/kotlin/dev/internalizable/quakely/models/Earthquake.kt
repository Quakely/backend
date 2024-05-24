package dev.internalizable.quakely.models

import dev.internalizable.quakely.Point
import kotlinx.serialization.Serializable

/**
 * @author GrowlyX
 * @since 5/21/2024
 */
@Serializable
data class Earthquake(
    val epicenter: GeospatialIndex,
    val magnitude: Double
)
