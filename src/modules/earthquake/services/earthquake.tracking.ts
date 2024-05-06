import {EarthquakeProvider} from "../providers/earthquake.provider";
import {USGSProvider} from "../providers/impl/usgs.provider";
import {ISCProvider} from "../providers/impl/isc.provider";
import {INGVProvider} from "../providers/impl/ingv.provider";
import {EMSCProvider} from "../providers/impl/emsc.provider";
import {getLogger} from "../../../index";
import {injectable, singleton} from "tsyringe";
import {getEarthquakeService} from "../index";
import {EarthquakeUtils} from "../utils/earthquake.utils";

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
        }, 100000);
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
                            earthquake.isoCode = await EarthquakeUtils.getISOByCoordinates(earthquake.coordinates.coordinates);
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
}
