import {index, modelOptions, prop} from "@typegoose/typegoose";
import {IsNumber, IsString} from "class-validator";
import {v4 as uuidv4} from "uuid";
import {GeoPointLocation} from "../../geology/geolocation.model";

@index({ epicenter: '2dsphere' })
@modelOptions({
    schemaOptions: {
        collection: "detections",
        timestamps: false
    },
})
export class Detection {
    @prop({ required: true, default: () => new GeoPointLocation() })
    public epicenter!: GeoPointLocation;
    @prop({required: true, validate: [IsNumber]})
    public magnitude!: number;
}
