package dev.internalizable.quakely.models

import kotlinx.serialization.Serializable

/**
 * @author Internalizable
 * @since 5/23/2024
 */
@Serializable
data class GeospatialIndex(
    val type: String,
    val coordinates: DoubleArray
)