import { prop, modelOptions } from "@typegoose/typegoose";

@modelOptions({ schemaOptions: { _id: false } })
export class GeoPointLocation {
    @prop({ required: true, enum: ['Point'], default: 'Point' })
    public type!: string;

    @prop({ required: true })
    public coordinates!: number[];
}
