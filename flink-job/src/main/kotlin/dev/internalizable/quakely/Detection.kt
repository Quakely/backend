package dev.internalizable.quakely

import dev.internalizable.quakely.models.Detection
import dev.internalizable.quakely.models.Earthquake
import dev.internalizable.quakely.models.GeospatialIndex
import org.apache.flink.util.Collector

/**
 * @author GrowlyX
 * @since 5/22/2024
 */
fun detectEarthquake(detections: Iterable<Detection>, out: Collector<Earthquake>)
{
    val points = detections.toList()
    if (points.size < 20) return

    println("Running hierarchical clustering")
    val clusters = hierarchicalClustering(points, 10.0)

    clusters
        .filter { it.size > 20 }
        .forEach { cluster ->
            val intersections = cluster
                .chunked(2)
                .mapNotNull { chunk ->
                    if (chunk.size < 2)
                    {
                        return@mapNotNull null
                    }

                    val (p1, p2) = chunk.map { vec ->
                        // y = mx + b, b = -m * longitude + latitude
                        val m = vec.deltaY / vec.deltaX
                        val b = -m * vec.longitude + vec.latitude

                        println("y=" + m + "x + $b")
                        m to b
                    }

                    calculateIntersectionPoint(p1.first, p1.second, p2.first, p2.second)
                }

            val epicenter = averagePoints(intersections)
            val magnitude = (30..70).random() / 10.0

            val earthquake = Earthquake(
                epicenter = GeospatialIndex("Point", doubleArrayOf(epicenter.y, epicenter.x)),
                magnitude = magnitude
            )

            out.collect(earthquake)
            println("Detected earthquake: $earthquake")
        }
}
