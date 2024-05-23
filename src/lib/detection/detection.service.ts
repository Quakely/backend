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

    /**
     * Simulate an earthquake by creating multiple detection data points
     * around a randomly chosen epicenter and publishing them to the Kafka topic
     */
    public async simulateEarthquake(epicenter?: { latitude: number, longitude: number }) {
        if (epicenter == undefined) {
            epicenter = {
                latitude: getRandomInRange(-90, 90),
                longitude: getRandomInRange(-180, 180),
            };
        }

        const numberOfDevices = 5;
        const maxDistanceKm = 10; // Maximum distance from the epicenter in kilometers
        const detections: Detection[] = [];

        const baseTimestamp = Date.now();

        for (let i = 0; i < numberOfDevices; i++) {
            const distanceKm = Math.random() * maxDistanceKm;
            const angle = Math.random() * 2 * Math.PI;

            // Convert distance from kilometers to degrees
            const deltaLat = (distanceKm / 111) * Math.cos(angle); // Latitude change
            const deltaLon = (distanceKm / (111 * Math.cos(epicenter.latitude * (Math.PI / 180)))) * Math.sin(angle); // Longitude change

            // Calculate the position of the device relative to the epicenter
            const deviceLatitude = epicenter.latitude + deltaLat;
            const deviceLongitude = epicenter.longitude + deltaLon;

            // Calculate direction vector components
            const directionX = epicenter.longitude - deviceLongitude;
            const directionY = epicenter.latitude - deviceLatitude;

            // Calculate the magnitude of the direction vector
            const magnitude = Math.sqrt(directionX * directionX + directionY * directionY);

            // Normalize the direction vector and scale it to simulate accelerometer changes
            const deltaX = (directionX / magnitude) * getRandomInRange(0, 1);
            const deltaY = (directionY / magnitude) * getRandomInRange(0, 1);

            const detection: Detection = {
                latitude: deviceLatitude,
                longitude: deviceLongitude,
                deltaX,
                deltaY,
                deviceId: "test",
                timestamp: baseTimestamp + Math.ceil(getRandomInRange(0, 10000)) // Random delay within 10 seconds
            };

            detections.push(detection);
        }

        for (const detection of detections) {
            await this.publishDetection(detection);
        }

        console.log(`Simulated earthquake at ${epicenter.latitude}, ${epicenter.longitude}`);
        return detections;
    }
}

/**
 * Generate a random number within a specified range
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Random number between min and max
 */
function getRandomInRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}
