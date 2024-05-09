import {injectable, singleton} from "tsyringe";
import {HydratedDocument} from "mongoose";
import {Earthquake, EarthquakeType} from "../models/earthquake.model";
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
     * Get predicted earthquake by features.
     * @param latitude The latitude of the earthquake.
     * @param longitude The longitude of the earthquake.
     * @param time The time the earthquake happened
     */
    public getPredictedEarthquakeByFeatures = async(latitude: number, longitude: number, time: Date): Promise<HydratedDocument<Earthquake> | null> => {
        const marginOfError = 0.1;
        const timeError = 1000 * 60 * 60 * 24;
        return EarthquakeModel.findOne({
            earthquakeType: EarthquakeType.PREDICTED,
            'coordinates.coordinates': {
                $geoWithin: {
                    $centerSphere: [[longitude, latitude], marginOfError / 6378.1]
                }
            },
            time: {
                $gte: new Date(time.getTime() - timeError),
                $lte: new Date(time.getTime() + timeError)
            }
        });
    }
    /**
     * Get earthquakes by distance and categorize them into local, regional, and global.
     * Fetch country ISO code for each earthquake.
     * @param userLocation User's location as a GeoPointLocation object.
     * @param category 'local' | 'regional' | 'global'
     * @param page Page number for pagination.
     * @param pageSize Number of earthquakes per page.
     */
    public async getVerifiedEarthquakes(userLocation: GeoPointLocation, category: 'local' | 'regional' | 'global', page: number, pageSize: number): Promise<PaginationResponse<EarthquakeDTO[]>> {
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
                $match: {
                    earthquakeType: EarthquakeType.VERIFIED
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
            ...countPipeline.slice(0, 2),
            { $sort: { time: -1 } },
            { $skip: (page - 1) * pageSize },
            { $limit: pageSize }
        ];

        const earthquakes = await EarthquakeModel.aggregate(queryPipeline).exec();
        const earthquakeDTOs: EarthquakeDTO[] = await Promise.all(earthquakes.map(async earthquake => {
            return {
                ...earthquake,
                distance: Number(earthquake.distance / 1000).toFixed(0)
            } as EarthquakeDTO
        }));

        return {
            total_pages: totalPages,
            total_elements: totalElements,
            contents: earthquakeDTOs
        };
    }
    /**
     * Get earthquakes by distance and categorize them into local, regional, and global.
     * Fetch country ISO code for each earthquake.
     * @param userLocation User's location as a GeoPointLocation object.
     * @param category 'local' | 'regional' | 'global'
     * @param page Page number for pagination.
     * @param pageSize Number of earthquakes per page.
     */
    public async getPredictedEarthquakes(userLocation: GeoPointLocation, category: 'local' | 'regional' | 'global', page: number, pageSize: number): Promise<PaginationResponse<EarthquakeDTO[]>> {
        const distanceLimits = {
            local: 1000000,
            regional: 2500000,
            global: Infinity
        };

        const maxDistance = distanceLimits[category];
        const minDistance = category === 'regional' ? distanceLimits.local : (category === 'global' ? distanceLimits.regional : 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

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
                $match: {
                    earthquakeType: EarthquakeType.PREDICTED,
                    time: {
                        $gte: today
                    }
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
            ...countPipeline.slice(0, 2),
            { $sort: { time: 1, distance: 1 } },
            { $skip: (page - 1) * pageSize },
            { $limit: pageSize }
        ];

        const earthquakes = await EarthquakeModel.aggregate(queryPipeline).exec();
        const earthquakeDTOs: EarthquakeDTO[] = await Promise.all(earthquakes.map(async earthquake => {
            return {
                ...earthquake,
                distance: Number(earthquake.distance / 1000).toFixed(0)
            } as EarthquakeDTO
        }));

        return {
            total_pages: totalPages,
            total_elements: totalElements,
            contents: earthquakeDTOs
        };
    }

    /**
     * Fetches earthquakes within a specified bounding box, filters by type, and sorts by significance.
     * @param lat_min Minimum latitude of the bounding box.
     * @param lat_max Maximum latitude of the bounding box.
     * @param lng_min Minimum longitude of the bounding box.
     * @param lng_max Maximum longitude of the bounding box.
     * @param types Array of EarthquakeType to filter by.
     * @returns Array of sorted earthquake documents.
     */
    public async getEarthquakesByRegionAndType(lat_min: number, lat_max: number, lng_min: number, lng_max: number, types: EarthquakeType[]): Promise<EarthquakeDTO[]> {
        const oneDayAgo = new Date(new Date().getTime() - (24 * 60 * 60 * 1000));

        const earthquakes = await EarthquakeModel.find({
            'coordinates.coordinates': {
                $geoWithin: {
                    $box: [
                        [lng_min, lat_min],
                        [lng_max, lat_max]
                    ]
                }
            },
            earthquakeType: { $in: types },
            time: { $gte: oneDayAgo }
        }).sort({ magnitude: -1, time: -1 }).limit(20).exec();

        return await Promise.all(earthquakes.map(async earthquake => {
            return {
                ...earthquake,
                distance: undefined
            } as EarthquakeDTO
        }));
    }
}
