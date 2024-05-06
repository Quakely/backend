import {GeoPointLocation} from "../../geology/geolocation.model";

export interface EarthquakeDTO {
    id: string;
    coordinates: GeoPointLocation;
    magnitude: number;
    place: string;
    time: Date;
    source: string;
    depth: number;
    earthquakeImage?: string;
    isoCode?: string;
    distance?: number;
}
