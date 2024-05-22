package dev.internalizable.quakely

import dev.internalizable.quakely.models.Detection
import dev.internalizable.quakely.models.Earthquake
import elki.clustering.dbscan.DBSCAN
import elki.data.DoubleVector
import elki.data.type.VectorFieldTypeInformation
import elki.database.StaticArrayDatabase
import elki.datasource.MultipleObjectsBundleDatabaseConnection
import elki.datasource.bundle.MultipleObjectsBundle
import elki.distance.minkowski.EuclideanDistance
import org.apache.flink.util.Collector

/**
 * @author GrowlyX
 * @since 5/22/2024
 */
fun detectEarthquake(detections: Iterable<Detection>, out: Collector<Earthquake>)
{
    val points = mutableListOf<DoubleVector>()
    var deviceCount = 0
    for (sensorData in detections) {
        val coordinates = doubleArrayOf(
            sensorData.latitude, sensorData.longitude,
            sensorData.deltaX, sensorData.deltaY
        )
        println("Found coordinates: ${coordinates.contentToString()}")

        points.add(DoubleVector(coordinates))
        deviceCount++
    }

    // Ensure we have data from at least 20 devices
    if (points.size < 2 || deviceCount < 20) return

    println("Running DBSCAN clustering schema")
    // Run DBSCAN clustering
    val type = VectorFieldTypeInformation(DoubleVector.FACTORY, 4)
    val connection = MultipleObjectsBundleDatabaseConnection(MultipleObjectsBundle.makeSimple(type, points))
    val database = StaticArrayDatabase(connection, null)
    database.initialize()

    val dbscan = DBSCAN(EuclideanDistance.STATIC, 5.0 / 6371.0, 2)
    val result = dbscan.autorun(database)

    result.allClusters.forEach { cluster ->
        println("Found a cluster with size ${cluster.size()} and data $cluster")

        if (cluster.size() < 2) return@forEach

        val refs = arrayListOf<DoubleVector>()

        cluster.iDs.forEach { dbRef ->
            val vec = database.getBundle(dbRef).data(1) as DoubleVector
            refs.add(vec)
        }

        println(refs)

        val intersections = refs
            .chunked(2)
            .mapNotNull { chunk ->
                val (p1, p2) = chunk.map { vec ->
                    val latitude = vec.doubleValue(0)
                    val longitude = vec.doubleValue(1)
                    val deltaX = vec.doubleValue(2)
                    val deltaY = vec.doubleValue(3)

                    // y = mx + b, b = -m * longitude + latitude
                    val m = deltaY / deltaX
                    val b = -m * longitude + latitude

                    println("y=" + m + "x + $b")
                    m to b
                }

                calculateIntersectionPoint(p1.first, p1.second, p2.first, p2.second)
            }

        val epicenter = averagePoints(intersections)
        val magnitude = (30..70).random() / 10.0

        val earthquake = Earthquake(
            epicenter = epicenter,
            magnitude = magnitude
        )

        out.collect(earthquake)
    }
}
