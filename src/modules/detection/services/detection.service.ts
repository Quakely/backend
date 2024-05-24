import {injectable, singleton} from "tsyringe";
import {Kafka, Producer} from "kafkajs";
import {getConfigurationService, getDetectionService, getNotificationService} from "../../../index";
import {DetectionDTO} from "../dtos/detection.dto";
import {v4 as uuidv4} from "uuid";
import {Detection} from "../models/detection.model";
import {DetectionModel, UserModel} from "../../models";
import {EarthquakeUtils} from "../../earthquake/utils/earthquake.utils";
import {EarthquakeType} from "../../earthquake/models/earthquake.model";
import detectionRoutes from "../routes/detection.routes";

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

    public async registerListener() {
        console.log("Registering Mongo Stream Listener");

        const changeStream = DetectionModel.watch();
        changeStream.on('change', (change) => {
            console.log('Change detected:', change);

            if (change.operationType === 'insert') {
                const detection: Detection = change.fullDocument;
                getDetectionService().handleSimulatedEarthquake(detection);
            }
        });
    }

    /**
     * Publish detection data to a Kafka topic
     * @param detection - The sensor data to publish
     */
    public async publishDetection(detection: DetectionDTO) {
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

        const numberOfDevices = 50;
        const maxDistanceKm = 10;
        const detections: DetectionDTO[] = [];

        const baseTimestamp = Date.now();

        for (let i = 0; i < numberOfDevices; i++) {
            const distanceKm = Math.random() * maxDistanceKm;
            const angle = Math.random() * 2 * Math.PI;

            const deltaLat = (distanceKm / 111) * Math.cos(angle); // Latitude change
            const deltaLon = (distanceKm / (111 * Math.cos(epicenter.latitude * (Math.PI / 180)))) * Math.sin(angle); // Longitude change

            const deviceLatitude = epicenter.latitude + deltaLat;
            const deviceLongitude = epicenter.longitude + deltaLon;

            const directionX = epicenter.longitude - deviceLongitude;
            const directionY = epicenter.latitude - deviceLatitude;

            const magnitude = Math.sqrt(directionX * directionX + directionY * directionY);

            const deltaX = (directionX / magnitude) * getRandomInRange(0, 1);
            const deltaY = (directionY / magnitude) * getRandomInRange(0, 1);

            const detection: DetectionDTO = {
                latitude: deviceLatitude,
                longitude: deviceLongitude,
                deltaX,
                deltaY,
                deviceId: uuidv4(),
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

    public async handleSimulatedEarthquake(earthquakeDetection: Detection) {
        const maxDistance = 1500000;

        console.log("Handling simulated earthquake " + earthquakeDetection);

        const users = await UserModel.aggregate([
            {
                $geoNear: {
                    near: earthquakeDetection.epicenter as { type: "Point"; coordinates: [number, number]; },
                    distanceField: "distance",
                    maxDistance: maxDistance,
                    spherical: true,
                    query: { "notification_options.enabled": true }
                }
            },
            {
                $project: {
                    anonymous_auth_identifier: 1,
                    distance: 1,
                    location_options: 1,
                    notification_options: 1
                }
            }
        ]);

        users.forEach((user) => {
            if (user.notification_options && user.notification_options.token) {
                const distanceKm = (user.distance / 1000).toFixed(2);

                const notificationPayload = {
                    app_id: "3fece6ef-a3f0-48f8-b2f9-e4fbb3a96d0e",
                    include_player_ids: [user.notification_options.token],
                    headings: { en: `Potential massive earthquake detected by Quakely!`},
                    contents: { en: 'An earthquake has been detected in your region!' },
                    data: {
                        type: "earthquake",
                        magnitude: earthquakeDetection.magnitude,
                        epicenterLat: earthquakeDetection.epicenter.coordinates[1],
                        epicenterLng: earthquakeDetection.epicenter.coordinates[0],
                        userLat: user.location_options.coordinates[1],
                        userLng: user.location_options.coordinates[0]
                    }
                };

                try {
                    const response = getNotificationService().oneSignalClient.createNotification(notificationPayload).then(r => {
                        console.log('Notification sent with image to user ' + user.anonymous_auth_identifier);
                        console.log(r.body);
                    })
                } catch (e) {
                    console.error('Error sending notification with image:', e);
                }
            }

            console.log(`User ${user.anonymous_auth_identifier} is within range of earthquake, Distance: ${user.distance / 1000} km`);
        });
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
