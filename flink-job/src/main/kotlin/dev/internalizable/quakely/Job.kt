package dev.internalizable.quakely

import dev.internalizable.quakely.models.Detection
import dev.internalizable.quakely.models.Earthquake
import elki.clustering.dbscan.DBSCAN
import elki.data.DoubleVector
import elki.data.type.VectorFieldTypeInformation
import elki.database.StaticArrayDatabase
import elki.database.ids.DBIDRef
import elki.datasource.MultipleObjectsBundleDatabaseConnection
import elki.datasource.bundle.MultipleObjectsBundle
import elki.distance.minkowski.EuclideanDistance
import kotlinx.serialization.ExperimentalSerializationApi
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.encodeToStream
import org.apache.flink.api.common.serialization.SimpleStringSchema
import org.apache.flink.connector.base.DeliveryGuarantee
import org.apache.flink.connector.kafka.sink.KafkaRecordSerializationSchema
import org.apache.flink.connector.kafka.sink.KafkaSink
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment
import org.apache.flink.streaming.api.functions.windowing.ProcessWindowFunction
import org.apache.flink.streaming.api.windowing.assigners.TumblingEventTimeWindows
import org.apache.flink.streaming.api.windowing.time.Time
import org.apache.flink.streaming.api.windowing.windows.TimeWindow
import org.apache.flink.streaming.connectors.kafka.FlinkKafkaConsumer
import org.apache.flink.util.Collector
import java.util.*
import kotlin.math.sqrt

const val KAFKA_BROKER_MAIN = "kafka:9092"
const val KAFKA_GROUP_ID = "quakely"
const val KAFKA_TOPIC_NAME = "quake-live-detection"

const val DETECTION_DELTA_THRESHOLD = 1.0

/**
 * @author GrowlyX
 * @since 5/21/2024
 */
fun main(args: Array<String>)
{
    val environment = StreamExecutionEnvironment.getExecutionEnvironment()
    val kafkaProperties = Properties().apply {
        setProperty("bootstrap.servers", KAFKA_BROKER_MAIN)
        setProperty("group.id", KAFKA_GROUP_ID)
    }

    val kafkaConsumer = FlinkKafkaConsumer(
        KAFKA_TOPIC_NAME,
        SimpleStringSchema(),
        kafkaProperties
    )

    val sensorDataStream = environment
        .addSource(kafkaConsumer)
        .map { record ->
            Json.decodeFromString<Detection>(record)
        }

    val earthquakeEvents = sensorDataStream
        .filter { sensorData ->
            val currentTime = System.currentTimeMillis()
            sqrt(sensorData.deltaX * sensorData.deltaX + sensorData.deltaY * sensorData.deltaY) > DETECTION_DELTA_THRESHOLD
                && (currentTime - sensorData.timestamp) < Time.minutes(1).toMilliseconds()
        }
        .keyBy { 0 } // Group by a dummy key to apply windowing
        .window(TumblingEventTimeWindows.of(Time.minutes(1)))
        .process(object : ProcessWindowFunction<Detection, Earthquake, Int, TimeWindow>()
        {
            override fun process(
                key: Int,
                context: Context,
                elements: Iterable<Detection>,
                out: Collector<Earthquake>
            )
            {
                val points = mutableListOf<DoubleVector>()
                val devices = mutableSetOf<String>()
                for (sensorData in elements)
                {
                    val coordinates = doubleArrayOf(
                        sensorData.latitude, sensorData.longitude,
                        sensorData.deltaX, sensorData.deltaX
                    )
                    points.add(DoubleVector(coordinates))

                    devices += sensorData.deviceId
                }

                // Ensure we have data from at least 20 devices
                if (points.size < 2 || devices.size < 20) return

                // Run DBSCAN clustering
                val type = VectorFieldTypeInformation(DoubleVector.FACTORY, 4)
                val connection = MultipleObjectsBundleDatabaseConnection(MultipleObjectsBundle.makeSimple(type, points))
                val database = StaticArrayDatabase(connection, null)
                database.initialize()

                val dbscan = DBSCAN(EuclideanDistance.STATIC, 5.0 / 6371.0, 2)
                val result = dbscan.autorun(database)

                result.allClusters.forEach { cluster ->
                    val refs = mutableListOf<DBIDRef>()
                    cluster.iDs.forEach { dbRef ->
                        refs += dbRef
                    }

                    val intersections = refs
                        .chunked(2)
                        .mapNotNull { chunk ->
                            val (p1, p2) = chunk.map { dbRef ->
                                val bundle = database.getBundle(dbRef)

                                val latitude = bundle.data(0) as Double
                                val longitude = bundle.data(1) as Double

                                val deltaX = bundle.data(2) as Double
                                val deltaY = bundle.data(3) as Double

                                // y= mx - m*longtitude + latitude
                                val m = deltaY / deltaX
                                val b = -m * longitude + latitude

                                m to b
                            }

                            calculateIntersectionPoint(p1.first, p1.second, p2.first, p2.second)
                        }

                    val epicenter = averagePoints(intersections)
                    val magnitude = (30..70).random() / 10.0

                    out.collect(Earthquake(
                        epicenter = epicenter,
                        magnitude = magnitude
                    ))
                }


                /*for (cluster in result.allClusters)
                {
                    if (cluster.size() < 2) continue

                    var latSum = 0.0
                    var lonSum = 0.0

                    cluster.iDs.forEach {
                        val vec = database[cluster.iDs][it]
                        latSum += vec.doubleValue(0)
                        lonSum += vec.doubleValue(1)
                    }


                    val clusterLat = latSum / cluster.size()
                    val clusterLon = lonSum / cluster.size()
                    out.collect(Tuple3(clusterLat, clusterLon, cluster.size().toDouble()))
                }*/
            }
        })


    val sink = KafkaSink.builder<Earthquake>()
        .setBootstrapServers(KAFKA_BROKER_MAIN)
        .setRecordSerializer(
            KafkaRecordSerializationSchema
                .builder<Earthquake>()
                .setTopic("quake-events")
                .setValueSerializationSchema<Earthquake> {
                    Json.encodeToString(it).encodeToByteArray()
                }
                .build()
        )
        .setDeliveryGuarantee(DeliveryGuarantee.AT_LEAST_ONCE)
        .build()

    earthquakeEvents.sinkTo(sink)
    environment.execute("Quakely Detection Pipeline")
}
