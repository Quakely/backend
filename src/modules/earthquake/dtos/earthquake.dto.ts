import {GeoPointLocation} from "../../geology/geolocation.model";
import {EarthquakeSource, EarthquakeType} from "../models/earthquake.model";

export interface EarthquakeDTO {
    id: string;
    coordinates: GeoPointLocation;
    magnitude: number;
    place: string;
    time: Date;
    source: EarthquakeSource;
    depth: number;
    earthquakeType: EarthquakeType;
    earthquakeImage?: string;
    isoCode?: string;
    distance?: number;
}
