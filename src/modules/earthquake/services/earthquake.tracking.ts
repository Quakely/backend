import {EarthquakeProvider} from "../providers/earthquake.provider";
import {USGSProvider} from "../providers/impl/usgs.provider";
import {ISCProvider} from "../providers/impl/isc.provider";
import {INGVProvider} from "../providers/impl/ingv.provider";
import {EMSCProvider} from "../providers/impl/emsc.provider";
import {getLogger} from "../../../index";
import {injectable, singleton} from "tsyringe";
import { MongoError } from 'mongodb';
import {getEarthquakeService} from "../index";

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

        setInterval(async () => {
            await this.fetchAllEarthquakes();
        }, 300000);
    }

    private async fetchAllEarthquakes(): Promise<void> {
        for (const provider of this.providers) {
            try {
                const earthquakes = await provider.fetchEarthquakes();
                console.log(`Fetched ${earthquakes.length} earthquakes from ${provider.quakeSource}`);

                earthquakes.map(async earthquake => {
                    try {
                        await getEarthquakeService().createEarthquake(earthquake);
                    } catch (error) {
                        if ((error as MongoError).code !== 11000) {
                            getLogger().logger.error(`An error occurred for earthquake with ID ${earthquake.id} whilst inserting in the database: `);
                            getLogger().logger.error((error as MongoError).message);
                        }
                    }
                })
            } catch (error) {
                getLogger().logger.error("Error fetching earthquakes from provider: " + provider.quakeSource, error);
            }
        }
    }
}
