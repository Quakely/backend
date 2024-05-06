import {EarthquakeProvider} from "../earthquake.provider";
import {Builder} from "builder-pattern";
import {getLogger} from "../../../../index";
import { parseStringPromise } from 'xml2js';
import {Earthquake, EarthquakeSource} from "../../models/earthquake.model";

export class ISCProvider extends EarthquakeProvider {

    constructor() {
        super(`https://www.isc.ac.uk/fdsnws/event/1/query?starttime=%start%&endtime=%end%&catalog=ISC`,
            EarthquakeSource.ISC);
    }

    async fetchEarthquakes(): Promise<Earthquake[]> {
        const { startTime, endTime } = this.getFormattedDates();
        const url = super.sourceURL.replace("%start%", startTime).replace("%end%", endTime);

        try {

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    'Accept': 'application/xml',
                    'Content-Type': 'application/xml'
                }
            });
            const xmlData = await response.text();
            const result = await parseStringPromise(xmlData, { explicitArray: false, ignoreAttrs: false });

            return this.processEarthquakeData(result);
        } catch (e) {
            getLogger().logger.error("An error occurred whilst fetching earthquakes from " + super.quakeSource);
            getLogger().logger.error(e);
            return [];
        }
    }


    private processEarthquakeData(data: any): Earthquake[] {
        const events = data['q:quakeml']['eventParameters']['event'] as any[];
        return events.filter(event => event.magnitude != undefined && event.magnitude.mag != undefined).map((event: any) => Builder(Earthquake)
            .id(event.preferredOriginID)
            .time(new Date(event.origin.time))
            .updatedAt(new Date())
            .coordinates({
                type: 'Point',
                coordinates: [parseFloat(event.origin.longitude), parseFloat(event.origin.latitude)]
            })
            .depth(parseFloat(event.origin.depth))
            .magnitude(parseFloat(event.magnitude.mag))
            .place(event.description.text)
            .source(this.quakeSource)
            .build());
    }

    private getFormattedDates(): { startTime: string, endTime: string } {
        const currentDate = new Date();
        const previousDay = new Date(new Date().getTime() - 86400000);
        const nextDay = new Date(currentDate.getTime() + 86400000);

        const startTime = previousDay.toISOString().split('T')[0] + "T00:00:00";
        const endTime = nextDay.toISOString().split('T')[0] + "T23:59:59";

        return { startTime, endTime };
    }

}
