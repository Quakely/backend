import {getModelForClass} from "@typegoose/typegoose";
import {User} from "./user/models/user.model";
import {Earthquake} from "./earthquake/models/earthquake.model";
import {Detection} from "./detection/models/detection.model";

export const UserModel = getModelForClass(User);
export const EarthquakeModel = getModelForClass(Earthquake);
export const DetectionModel = getModelForClass(Detection)