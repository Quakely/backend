import {
    index,
    modelOptions, prop
} from "@typegoose/typegoose";
import { IsString} from "class-validator";
import { v4 as uuidv4 } from 'uuid';
import {GeoPointLocation} from "../../geology/geolocation.model";

@modelOptions({ schemaOptions: { _id: false } })
export class NotificationOptions {
    @prop({required: true, default: false})
    public enabled!: boolean;

    @prop({required: true, default: ""})
    public token!: string;
}

@index({ location_options: '2dsphere' })
@modelOptions({
    schemaOptions: {
        collection: "users",
        timestamps: false
    },
})
export class User {
    @prop({required: true, validate: [IsString], default: uuidv4()})
    public anonymous_auth_identifier!: string;

    @prop({ required: true, default: () => new GeoPointLocation() })
    public location_options!: GeoPointLocation;

    @prop({required: true, default: new NotificationOptions()})
    public notification_options!: NotificationOptions;

    @prop({required: true, default: false})
    public disabled!: boolean;
}
