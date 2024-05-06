import {Request, Response} from "express";
import {RegisterUserDTO} from "../../user/dtos/user.dto";
import {getUserService} from "../../user";
import {StatusCodes} from "http-status-codes";
import {Builder} from "builder-pattern";
import QuakelyServerResponse from "../../../utils/response";
import {UserTransformer} from "../../user/transformers/user.transformer";
import {HydratedDocument} from "mongoose";
import {User} from "../../user/models/user.model";
import {getEarthquakeService} from "../index";

export class EarthquakeController {
    static getPaginatedEarthquakes = async (req: Request, res: Response) => {
        const user = res.locals.user as HydratedDocument<User>;
        const page = req.query.page ? Number(req.query.page) : 1;
        const size = req.query.size ? Number(req.query.size) : 10;
        const regionType = req.query.region ? req.query.regionType as "local" | "regional" | "global" : "local";

        const earthquakes = await getEarthquakeService()
            .getEarthquakes(user.location_options, regionType, page, size);

        return res.status(StatusCodes.OK).json(
            Builder(QuakelyServerResponse)
                .code(StatusCodes.OK)
                .message("Successfully fetched requested earthquakes")
                .data(earthquakes)
                .build()
        )
    }
}
