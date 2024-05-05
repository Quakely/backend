import {getService} from "../../index";
import {EarthquakeTrackingService} from "./services/earthquake.tracking";
import {EarthquakeService} from "./services/earthquake.service";

export const getEarthquakeService = (): EarthquakeService => {
    return getService(EarthquakeService);
}

export const getEarthquakeTrackingService = (): EarthquakeTrackingService => {
    return getService(EarthquakeTrackingService);
}
