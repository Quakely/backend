import {injectable, singleton} from "tsyringe";
import {HydratedDocument} from "mongoose";
import {Earthquake} from "../models/earthquake.model";
import {EarthquakeModel} from "../../models";
import {GeoPointLocation} from "../../geology/geolocation.model";
import {EarthquakeDTO} from "../dtos/earthquake.dto";
import {PaginationResponse} from "../../../utils/pagination";

@singleton()
@injectable()
export class EarthquakeService {
    public createEarthquake = async(earthquake: Earthquake): Promise<HydratedDocument<Earthquake>> => {
        return EarthquakeModel.create(earthquake);
    }
    /**
     * Get earthquake by providing its id.
     * @param earthquakeId The earthquake's id.
     */
    public getEarthquakeById = async(earthquakeId: string): Promise<HydratedDocument<Earthquake> | null> => {
        return EarthquakeModel.findOne({id: earthquakeId})
    }
    /**
     * Get earthquakes by distance and categorize them into local, regional, and global.
     * Fetch country ISO code for each earthquake.
     * @param userLocation User's location as a GeoPointLocation object.
     * @param category 'local' | 'regional' | 'global'
     * @param page Page number for pagination.
     * @param pageSize Number of earthquakes per page.
     */
    public async getEarthquakes(userLocation: GeoPointLocation, category: 'local' | 'regional' | 'global', page: number, pageSize: number): Promise<PaginationResponse<EarthquakeDTO[]>> {
        const distanceLimits = {
            local: 1000000,
            regional: 2500000,
            global: Infinity
        };

        const maxDistance = distanceLimits[category];
        const minDistance = category === 'regional' ? distanceLimits.local : (category === 'global' ? distanceLimits.regional : 0);

        const countPipeline: any[] = [
            {
                $geoNear: {
                    near: { type: "Point", coordinates: [userLocation.coordinates[0], userLocation.coordinates[1]] },
                    distanceField: "distance",
                    maxDistance: maxDistance,
                    minDistance: minDistance,
                    spherical: true
                }
            },
            {
                $count: "total"
            }
        ];

        const totalResults = await EarthquakeModel.aggregate(countPipeline).exec();
        const totalElements: number = totalResults[0] ? totalResults[0].total : 0;
        const totalPages = Math.ceil(totalElements / pageSize);

        const queryPipeline: any[] = [
            ...countPipeline.slice(0, 1),
            { $sort: { time: -1 } },
            { $skip: (page - 1) * pageSize },
            { $limit: pageSize }
        ];

        const earthquakes = await EarthquakeModel.aggregate(queryPipeline).exec();
        const earthquakeDTOs: EarthquakeDTO[] = await Promise.all(earthquakes.map(async earthquake => {
            return {
                ...earthquake,
                distance: earthquake.distance
            } as EarthquakeDTO
        }));

        return {
            total_pages: totalPages,
            total_elements: totalElements,
            contents: earthquakeDTOs
        };
    }
}
