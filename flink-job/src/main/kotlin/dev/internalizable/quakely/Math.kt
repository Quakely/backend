package dev.internalizable.quakely

import kotlinx.serialization.Serializable

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

fun calculateIntersectionPoint(
    m1: Double,
    b1: Double,
    m2: Double,
    b2: Double
): Point?
{
    if (m1 == m2)
    {
        return null
    }

    val x = (b2 - b1) / (m1 - m2)
    val y = m1 * x + b1
    return Point(x, y)
}
