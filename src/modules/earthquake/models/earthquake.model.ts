import {index, modelOptions, post, pre, prop} from "@typegoose/typegoose";
import {IsString} from "class-validator";
import {v4 as uuidv4} from "uuid";
import {UserModel} from "../../models";
import {GeoPointLocation} from "../../geology/geolocation.model";
import * as fs from "fs";
import {getConfigurationService, getNotificationService, getStorageService} from "../../../index";
import {EarthquakeUtils} from "../utils/earthquake.utils";
import path from "node:path";
import * as os from "node:os";

export enum EarthquakeType {
    VERIFIED = "VERIFIED",
    PREDICTED = "PREDICTED",
}
export enum EarthquakeSource {
    USGS = "USGS",
    EMSC = "EMSC",
    INGV = "INGV",
    ISC = "ISC",
    QUAKELY = "QUAKELY"
}

function capitalizeFirstLetter(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function normalizePlace(place: string): string {
    return place.split(' ').map(capitalizeFirstLetter).join(' ');
}

@index({ coordinates: '2dsphere' })
@modelOptions({
    schemaOptions: {
        collection: "earthquakes",
        timestamps: false
    },
})
@pre<Earthquake>('save', async function () {
    this.place = normalizePlace(this.place);

    const mapImageUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${this.coordinates.coordinates[1]},${this.coordinates.coordinates[0]}&size=512x380&scale=2&zoom=1&path=color:red|weight:1|${this.coordinates.coordinates[1]},180|${this.coordinates.coordinates[1]},0|${this.coordinates.coordinates[1]},180&path=color:red|weight:1|geodesic:false|90,${this.coordinates.coordinates[0]}|-90,${this.coordinates.coordinates[0]}&key=${getConfigurationService().options.googleMapsAPIKey}`;

    try {
        const response = await fetch(mapImageUrl);

        if (response.ok) {
            const imageBuffer = await response.arrayBuffer();
            const tempFilePath = path.join(os.tmpdir(), `earthquake-${this.id}-notification.png`);
            fs.writeFileSync(
                tempFilePath,
                Buffer.from(imageBuffer)
            );

            const earthquakeImageUrl = await getStorageService().uploadFileToStorageBucket(tempFilePath, `earthquake-${this.id}.png`, 'earthquakes/notifications');
            console.log(earthquakeImageUrl)
            this.earthquakeImage = earthquakeImageUrl;
        }
    } catch (error) {
        console.error('Error fetching or uploading the map image:', error);
    }
})
@post<Earthquake>('save', async (earthquake) => {
    const maxDistance = 1500000;

    const users = await UserModel.aggregate([
        {
            $geoNear: {
                near: earthquake.coordinates as { type: "Point"; coordinates: [number, number]; },
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
                notification_options: 1,
                place: `$${earthquake.place}`
            }
        }
    ]);

    const large_icon_url = await EarthquakeUtils.getBadge(earthquake.magnitude);

    users.forEach((user) => {
        if (user.notification_options && user.notification_options.token) {
            const distanceKm = (user.distance / 1000).toFixed(2);
            const mapImageUrl = earthquake.earthquakeImage;
            const message = `${earthquake.place}, @${distanceKm} from your position.`;

            const notificationPayload = {
                app_id: "3fece6ef-a3f0-48f8-b2f9-e4fbb3a96d0e",
                include_player_ids: [user.notification_options.token],
                headings: { en: `Earthquake ${earthquake.earthquakeType == EarthquakeType.PREDICTED ? 'predicted' : 'detected'} by ` + earthquake.source },
                contents: { en: message },
                big_picture: mapImageUrl,
                large_icon: large_icon_url,
                url: `quakely://map?latitude=${earthquake.coordinates.coordinates[0]}&longitude=${earthquake.coordinates.coordinates[1]}`
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

        console.log(`User ${user.anonymous_auth_identifier} is within range of earthquake at ${earthquake.place}, Distance: ${user.distance / 1000} km`);
    });
})
export class Earthquake {
    @prop({required: true, unique: true, validate: [IsString], default: uuidv4()})
    public id!: string;

    @prop({ required: true, default: () => new GeoPointLocation() })
    public coordinates!: GeoPointLocation;

    @prop({ required: true, default: () => EarthquakeType.VERIFIED })
    public earthquakeType!: EarthquakeType;

    @prop({required: true, default: 0})
    public depth!: number;

    @prop({required: true, default: 0})
    public magnitude!: number;

    @prop({required: true, default: new Date()})
    public time!: Date;

    @prop({required: true, default: new Date()})
    public updatedAt!: Date;

    @prop({required: true, default: ""})
    public place!: string;

    @prop({required: true, default: EarthquakeSource.USGS})
    public source!: EarthquakeSource;

    @prop({required: false, default: ""})
    public earthquakeImage?: string;

    @prop({required: false, default: ""})
    public isoCode?: string;
}
