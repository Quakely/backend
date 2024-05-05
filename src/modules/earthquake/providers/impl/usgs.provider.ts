import {EarthquakeProvider} from "../earthquake.provider";
import {Builder} from "builder-pattern";
import {getLogger} from "../../../../index";
import {Earthquake, EarthquakeSource} from "../../models/earthquake.model";

export class USGSProvider extends EarthquakeProvider {

    constructor() {
        super("https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&limit=100&orderby=time&eventtype=earthquake", EarthquakeSource.USGS);
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
                        .time(new Date(feature.properties.time))
                        .updatedAt(new Date(feature.properties.updated))
                        .coordinates({
                            type: feature.geometry.type,
                            coordinates: (feature.geometry.coordinates as number[]).slice(0, 2)
                        })
                        .magnitude(feature.properties.mag)
                        .depth((feature.geometry.coordinates as number[]).at(2)!)
                        .place(feature.properties.place)
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
