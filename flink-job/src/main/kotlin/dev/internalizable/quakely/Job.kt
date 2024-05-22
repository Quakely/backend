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
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.apache.flink.api.common.serialization.SimpleStringSchema
import org.apache.flink.connector.kafka.sink.KafkaRecordSerializationSchema
import org.apache.flink.connector.kafka.sink.KafkaSink
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment
import org.apache.flink.streaming.api.functions.windowing.ProcessAllWindowFunction
import org.apache.flink.streaming.api.functions.windowing.ProcessWindowFunction
import org.apache.flink.streaming.api.windowing.assigners.TumblingEventTimeWindows
import org.apache.flink.streaming.api.windowing.time.Time
import org.apache.flink.streaming.api.windowing.windows.TimeWindow
import org.apache.flink.streaming.connectors.kafka.FlinkKafkaConsumer
import org.apache.flink.util.Collector
import java.time.Duration
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

    val earthquakeEvents = environment
        .addSource(kafkaConsumer)
        .map { record ->
            Json.decodeFromString<Detection>(record)
        }
        .filter { sensorData ->
            val currentTime = System.currentTimeMillis()
            sqrt(sensorData.deltaX * sensorData.deltaX + sensorData.deltaY * sensorData.deltaY) > DETECTION_DELTA_THRESHOLD
                && (currentTime - sensorData.timestamp) < Time.minutes(1).toMilliseconds()
        }
        .keyBy(Detection::deviceId)
        .windowAll(TumblingEventTimeWindows.of(Duration.ofMinutes(1)))
        .process(object : ProcessAllWindowFunction<Detection, Earthquake, TimeWindow>()
        {
            override fun process(
                context: Context,
                elements: Iterable<Detection>,
                out: Collector<Earthquake>
            )
            {
                detectEarthquake(detections = elements, out = out)
            }
        })

    earthquakeEvents.print()
    environment.execute("Quakely Detection Pipeline")
}
