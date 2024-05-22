import {injectable, singleton} from "tsyringe";
import {Kafka, Producer} from "kafkajs";
import {getConfigurationService, getLogger} from "../../index";
import {Detection} from "../../modules/earthquake/detection/detection.model";

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
        })
    }

    /**
     * Publish detection data to a Kafka topic
     * @param detection - The sensor data to publish
     */
    public async publishDetection(detection: Detection) {
        const message = {
            key: detection.timestamp.toString(),
            value: JSON.stringify(detection),
        };

        try {
            await this.producer.send({
                topic: "quake-live-detection",
                messages: [message],
            });
        } catch (error) {
            // @ts-ignore
            console.error(`Failed to publish detection data: ${error.message}`);
        }
    }

    get kafkaClient(): Kafka {
        return this._kafkaClient;
    }
}
