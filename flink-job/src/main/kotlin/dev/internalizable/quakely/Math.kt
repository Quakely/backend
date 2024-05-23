package dev.internalizable.quakely

import dev.internalizable.quakely.models.Detection
import kotlinx.serialization.Serializable
import kotlin.math.*

/**
 * @author GrowlyX
 * @since 5/21/2024
 */
@Serializable
data class Point(
    val x: Double,
    val y: Double
)

fun averagePoints(points: Collection<Point>): Point {
    if (points.isEmpty()) throw IllegalArgumentException("Collection of points must not be empty")

    val (sumX, sumY) = points.fold(0.0 to 0.0) { acc, point ->
        (acc.first + point.x) to (acc.second + point.y)
    }

    val count = points.size
    return Point(sumX / count, sumY / count)
}

fun haversine(
    lat1: Double, lat2: Double, lon1: Double,
    lon2: Double, el1: Double, el2: Double
): Double {
    val R = 6371 // Radius of the earth

    val latDistance = Math.toRadians(lat2 - lat1)
    val lonDistance = Math.toRadians(lon2 - lon1)
    val a = sin(latDistance / 2) * sin(latDistance / 2) + cos(
        Math.toRadians(
            lat1
        )
    ) * cos(Math.toRadians(lat2)) * sin(lonDistance / 2) * sin(
        lonDistance / 2
    )
    val c = 2 * atan2(sqrt(a), sqrt(1 - a))
    var distance = R * c * 1000 // convert to meters

    val height = el1 - el2

    distance = distance.pow(2.0) + height.pow(2.0)

    return sqrt(distance) / 1000
}

fun hierarchicalClustering(points: List<Detection>, threshold: Double): List<List<Detection>> {
    val clusters = mutableListOf<MutableList<Detection>>()

    points.forEach { point ->
        var addedToCluster = false

        clusters.forEach { cluster ->
            if (cluster.any { haversine(it.latitude, point.latitude, it.longitude, point.longitude, 0.0, 0.0) <= threshold }) {
                cluster.add(point)
                addedToCluster = true
            }
        }

        if (!addedToCluster) {
            clusters.add(mutableListOf(point))
        }
    }

    return clusters
}

fun calculateIntersectionPoint(
    m1: Double,
    b1: Double,
    m2: Double,
    b2: Double
): Point? {
    if (m1 == m2) {
        return null
    }

    val x = (b2 - b1) / (m1 - m2)
    val y = m1 * x + b1
    return Point(x, y)
}
