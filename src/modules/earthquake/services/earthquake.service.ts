import {injectable, singleton} from "tsyringe";
import {HydratedDocument} from "mongoose";
import {Earthquake} from "../models/earthquake.model";
import {EarthquakeModel} from "../../models";

@singleton()
@injectable()
export class EarthquakeService {
    public createEarthquake = async(earthquake: Earthquake): Promise<HydratedDocument<Earthquake>> => {
        return EarthquakeModel.create(earthquake);
    }
}
