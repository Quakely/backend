package dev.internalizable.quakely

import com.mongodb.client.model.InsertOneModel
import dev.internalizable.quakely.models.Detection
import dev.internalizable.quakely.models.Earthquake
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.apache.flink.api.common.RuntimeExecutionMode
import org.apache.flink.api.common.eventtime.WatermarkStrategy
import org.apache.flink.api.common.serialization.SimpleStringSchema
import org.apache.flink.connector.kafka.source.KafkaSource
import org.apache.flink.connector.kafka.source.enumerator.initializer.OffsetsInitializer
import org.apache.flink.connector.kafka.source.reader.deserializer.KafkaRecordDeserializationSchema
import org.apache.flink.connector.mongodb.sink.MongoSink
import org.apache.flink.connector.mongodb.sink.writer.context.MongoSinkContext
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment
import org.apache.flink.streaming.api.functions.windowing.ProcessAllWindowFunction
import org.apache.flink.streaming.api.windowing.assigners.TumblingEventTimeWindows
import org.apache.flink.streaming.api.windowing.time.Time
import org.apache.flink.streaming.api.windowing.windows.TimeWindow
import org.apache.flink.util.Collector
import org.apache.kafka.common.serialization.StringDeserializer
import org.bson.BsonDocument

const val KAFKA_BROKER_MAIN = "kafka:9092"
const val KAFKA_GROUP_ID = "quakely"
const val KAFKA_TOPIC_NAME = "quake-live-detections"

const val MONGO_DATABASE_NAME = "quakely"
const val MONGO_COLLECTION_NAME = "live-earthquakes"

/**
 * @author GrowlyX
 * @since 5/21/2024
 */
fun main(args: Array<String>)
{
    val environment = StreamExecutionEnvironment.getExecutionEnvironment()
    environment.setRuntimeMode(RuntimeExecutionMode.STREAMING)

    val source = KafkaSource.builder<String>()
        .setBootstrapServers(KAFKA_BROKER_MAIN)
        .setTopics(KAFKA_TOPIC_NAME)
        .setGroupId(KAFKA_GROUP_ID)
        .setStartingOffsets(OffsetsInitializer.earliest())
        .setValueOnlyDeserializer(SimpleStringSchema())
        .setDeserializer(KafkaRecordDeserializationSchema.valueOnly(StringDeserializer::class.java))
        .build()

    val earthquakeEvents = environment
        .fromSource(source, WatermarkStrategy.noWatermarks(), "Kafka Source")
        .map { record ->
            Json.decodeFromString<Detection>(record)
        }
        .assignTimestampsAndWatermarks(
            WatermarkStrategy.forMonotonousTimestamps<Detection>()
                .withTimestampAssigner { event, _ -> event.timestamp }
        )
        .keyBy(Detection::deviceId)
        .windowAll(TumblingEventTimeWindows.of(Time.minutes(1)))
        .process(object : ProcessAllWindowFunction<Detection, Earthquake, TimeWindow>()
        {
            override fun process(
                context: Context,
                elements: Iterable<Detection>,
                out: Collector<Earthquake>
            )
            {
                detectEarthquake(elements, out)
            }
        })

    val detectedEarthquakesSink = MongoSink.builder<Earthquake>()
        .setUri("mongodb+srv://internalizable:VWrSgL4vFwxZ6QqW@quakely.y8qjey5.mongodb.net/?retryWrites=true&w=majority&appName=quakely")
        .setDatabase(MONGO_DATABASE_NAME)
        .setCollection(MONGO_COLLECTION_NAME)
        .setBatchSize(1000)
        .setBatchIntervalMs(1000)
        .setMaxRetries(3)
        .setSerializationSchema { input, _ ->
            val jsonString = Json.encodeToString(input)
            InsertOneModel(BsonDocument.parse(jsonString))
        }
        .build()

    earthquakeEvents.sinkTo(detectedEarthquakesSink)
    environment.execute("Quakely Detection Pipeline")
}
