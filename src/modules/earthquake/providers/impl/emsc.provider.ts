import {EarthquakeProvider} from "../earthquake.provider";
import {Earthquake, EarthquakeSource, EarthquakeType} from "../../models/earthquake.model";
import {Builder} from "builder-pattern";
import {getLogger} from "../../../../index";

export class EMSCProvider extends EarthquakeProvider {

    constructor() {
        super("https://www.seismicportal.eu/fdsnws/event/1/query?format=json&limit=100&orderby=time", EarthquakeSource.EMSC);
    }

    async fetchEarthquakes(): Promise<Earthquake[]> {
        try {
            const earthquakeResponse = await fetch(super.sourceURL, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            const earthquakes = await earthquakeResponse.json();
            const features = earthquakes.features as any[];

            if(features) {
                return features.map(feature => {
                    return Builder(Earthquake)
                        .id(feature.id)
                        .earthquakeType(EarthquakeType.VERIFIED)
                        .time(new Date(feature.properties.time))
                        .updatedAt(new Date(feature.properties.lastupdate))
                        .coordinates({
                            type: feature.geometry.type,
                            coordinates: (feature.geometry.coordinates as number[]).slice(0, 2)
                        })
                        .magnitude(feature.properties.mag)
                        .depth((feature.geometry.coordinates as number[]).at(2)!)
                        .place(feature.properties.flynn_region)
                        .source(super.quakeSource)
                        .build();
                });
            }
        } catch (e) {
            getLogger().logger.error("An error occurred whilst fetching earthquakes from " + super.quakeSource);
            getLogger().logger.error(e);
        }

        return [];
    }

}
