import {injectable, singleton} from "tsyringe";
import {Kafka, Producer} from "kafkajs";
import {getConfigurationService, getLogger} from "../../index";

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

        getLogger().logger.info("Connecting to Kafka")
        this.producer = this.kafkaClient.producer()
        this.producer.connect().then(() => {
            getLogger().logger.info("Connected to producer")
        })
    }

    get kafkaClient(): Kafka {
        return this._kafkaClient;
    }
}
