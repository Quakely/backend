import {HydratedDocument} from "mongoose";
import {User} from "../../user/models/user.model";
import {UserDTO} from "../../user/dtos/user.dto";
import {Earthquake} from "../models/earthquake.model";
import {EarthquakeDTO} from "../dtos/earthquake.dto";
import {GeoPointLocation} from "../../geology/geolocation.model";

export class EarthquakeTransformer {

    private _earthquake!: HydratedDocument<Earthquake>;

    constructor(earthquake: HydratedDocument<Earthquake>) {
        this._earthquake = earthquake;
    }

    toEarthquakeDTO(distance?: number): EarthquakeDTO {
        return {
            id: this._earthquake.id,
            coordinates: this._earthquake.coordinates,
            magnitude: +Number(this._earthquake.magnitude).toFixed(1),
            place: this._earthquake.place,
            time: this._earthquake.time,
            source: this._earthquake.source,
            depth: +Number(this._earthquake.depth).toFixed(1),
            earthquakeType: this._earthquake.earthquakeType,
            earthquakeImage: this._earthquake.earthquakeImage,
            isoCode: this._earthquake.isoCode,
            distance: +Number(distance).toFixed(0)
        } as EarthquakeDTO;
    }
}
