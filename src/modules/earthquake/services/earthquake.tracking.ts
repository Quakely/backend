import {EarthquakeProvider} from "../providers/earthquake.provider";
import {USGSProvider} from "../providers/impl/usgs.provider";
import {ISCProvider} from "../providers/impl/isc.provider";
import {INGVProvider} from "../providers/impl/ingv.provider";
import {EMSCProvider} from "../providers/impl/emsc.provider";
import {getLogger} from "../../../index";
import {injectable, singleton} from "tsyringe";
import {getEarthquakeService} from "../index";
import {EarthquakeUtils} from "../utils/earthquake.utils";
import {Earthquake, EarthquakeSource, EarthquakeType} from "../models/earthquake.model";
import {Builder} from "builder-pattern";
import {v4 as uuidv4} from "uuid";
import {EarthquakeModel} from "../../models";

@singleton()
@injectable()
export class EarthquakeTrackingService {
    private readonly providers: EarthquakeProvider[];

    constructor() {
        this.providers = [
            new USGSProvider(),
            new ISCProvider(),
            new INGVProvider(),
            new EMSCProvider()
        ];
    }

    public startEarthquakeTracking = async (): Promise<void> => {
        await this.fetchAllEarthquakes();
        await this.fetchPredictedEarthquakes();

        setInterval(async () => {
            await this.fetchAllEarthquakes();
        }, 100000);

        setInterval(async () => {
            await this.fetchPredictedEarthquakes();
        }, 604800000)
    }

    private async fetchAllEarthquakes(): Promise<void> {
        for (const provider of this.providers) {
            try {
                const earthquakes = await provider.fetchEarthquakes();
                console.log(`Fetched ${earthquakes.length} earthquakes from ${provider.quakeSource}`);

                earthquakes.map(async earthquake => {
                    try {
                        const dbEarthquake = await getEarthquakeService().getEarthquakeById(earthquake.id);

                        if(dbEarthquake == null) {
                            const {place, iso} = await EarthquakeUtils.getPlaceAndISOByCoordinates(earthquake.place,
                                earthquake.coordinates.coordinates);

                            earthquake.isoCode = iso;
                            earthquake.place = place;

                            await getEarthquakeService().createEarthquake(earthquake);
                        }
                    } catch (error) {
                        getLogger().logger.error(`An error occurred for earthquake with ID ${earthquake.id} whilst inserting in the database: `);
                        getLogger().logger.error((error as Error).message);
                    }
                })
            } catch (error) {
                getLogger().logger.error("Error fetching earthquakes from provider: " + provider.quakeSource, error);
            }
        }
    }
    private async fetchPredictedEarthquakes(): Promise<void> {
        const response = await fetch("http://localhost:8000/earthquakes", {
            method: "GET",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if(response.ok) {
            const responseJson = await response.json();
            const earthquakePredictions = responseJson.data as any[];

            console.log("Earthquake predictions " + earthquakePredictions);

            await Promise.all(earthquakePredictions.map(async earthquakePrediction => {
                try {
                    const earthquake = Builder(Earthquake)
                        .earthquakeType(EarthquakeType.PREDICTED)
                        .id(uuidv4())
                        .time(new Date(earthquakePrediction.timestamp))
                        .updatedAt(new Date(earthquakePrediction.timestamp))
                        .coordinates({
                            type: 'Point',
                            coordinates: [parseFloat(earthquakePrediction.longitude), parseFloat(earthquakePrediction.latitude)]
                        })
                        .depth(parseFloat(earthquakePrediction.depth))
                        .magnitude(parseFloat(earthquakePrediction.magnitude))
                        .place("Earth")
                        .source(EarthquakeSource.QUAKELY)
                        .build();

                    console.log("At earthquake with id: " + earthquake.id);

                    const dbEarthquake = await getEarthquakeService()
                        .getPredictedEarthquakeByFeatures(earthquake.coordinates.coordinates[1], earthquake.coordinates.coordinates[0], earthquake.time);

                    if(dbEarthquake == null) {
                        console.log("DB Earthquake does not exist")
                        const {place, iso} = await EarthquakeUtils.getPlaceAndISOByCoordinates(earthquake.place,
                            earthquake.coordinates.coordinates);

                        earthquake.isoCode = iso;
                        earthquake.place = place;

                        await getEarthquakeService().createEarthquake(earthquake);
                        console.log("Created earthquake.")
                    } else {
                        console.log("DB Earthquake exists.")
                    }
                } catch (error) {
                    getLogger().logger.error(`An error occurred for earthquake with ID ${earthquakePrediction} whilst inserting in the database: `);
                    getLogger().logger.error((error as Error).message);
                }
            }))
        } else {
            console.log(response.status);
        }
    }
}
