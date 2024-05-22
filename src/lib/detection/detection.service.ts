import {injectable, singleton} from "tsyringe";
import {Kafka, Producer, RecordMetadata} from "kafkajs";
import {getConfigurationService, getLogger} from "../../index";
import {Detection} from "../../modules/earthquake/detection/detection.model";
import {randomBytes} from "node:crypto";

@singleton()
@injectable()
export class DetectionService {
    private readonly _kafkaClient: Kafka;
    private readonly producer: Producer;

    constructor() {
        const options = getConfigurationService().options
        this._kafkaClient = new Kafka({
            clientId: options.kafkaClientId,
            brokers: [options.kafkaBroker!],
        })

        console.log("Connecting to KAFKA")
        this.producer = this.kafkaClient.producer()
        this.producer.connect().then(() => {
            console.log("Connected to KAFKA -> PRODUCER")

            for (let i = 0; i < 70; i++) {
                this.publishDetection({
                    deltaX: 5.1,
                    deltaY: 5.1,
                    latitude: 40.6432256,
                    longitude: -73.7904846,
                    timestamp: Date.now(),
                    deviceId: randomBytes(6).toString('hex')
                }).then(x => {
                    console.log(`Published ${i} ---`)
                })
            }
        })
    }

    /**
     * Publish detection data to a Kafka topic
     * @param detection - The sensor data to publish
     */
    public async publishDetection(detection: Detection): Promise<RecordMetadata[]> {
        const message = {
            key: detection.timestamp.toString(),
            value: JSON.stringify(detection),
        };

        try {
            return await this.producer.send({
                topic: "quake-live-detection",
                messages: [message],
            });
        } catch (error) {
            // @ts-ignore
            console.error(`Failed to publish detection data: ${error.message}`);
            return Promise.reject([])
        }
    }

    get kafkaClient(): Kafka {
        return this._kafkaClient;
    }
}
