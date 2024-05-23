import {Request, Response} from "express";
import {Detection} from "../detection.model";
import {StatusCodes} from "http-status-codes";
import QuakelyServerResponse from "../../../../utils/response";
import {Builder} from "builder-pattern";
import {getDetectionService} from "../../../../index";
import {User} from "../../../user/models/user.model";
import {HydratedDocument} from "mongoose";

export class DetectionController {
    static publishDetection = async (req: Request, res: Response) => {
        const user = res.locals.user as HydratedDocument<User>;
        const service = getDetectionService();
        const detection: Detection = {
            latitude: req.body.latitude,
            longitude: req.body.longitude,
            deltaX: req.body.deltaX,
            deltaY: req.body.deltaY,
            deviceId: user.anonymous_auth_identifier,
            timestamp: req.body.timestamp,
        };

        try {
            await service.publishDetection(detection)
            return res.status(StatusCodes.OK).json(
                Builder(QuakelyServerResponse)
                    .code(StatusCodes.OK)
                    .message("Successfully published detection")
                    .build()
            );
        } catch (error) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
                Builder(QuakelyServerResponse)
                    .code(StatusCodes.INTERNAL_SERVER_ERROR)
                    .message("Failed to publish detection data")
                    .build()
            );
        }
    }
    static simulateEarthquake = async (req: Request, res: Response) => {
        let epicenter: {latitude: number, longitude: number} | undefined = undefined;

        if(req.query.epicenterLatitude && req.query.epicenterLongitude) {
            epicenter = {
                latitude: Number(req.query.epicenterLatitude),
                longitude: Number(req.query.epicenterLongitude)
            }
        }

        const simulationDetectionsData = await getDetectionService().simulateEarthquake(epicenter);

        return res.status(StatusCodes.OK).json(
            Builder(QuakelyServerResponse)
                .code(StatusCodes.OK)
                .message("Successfully simulated earthquake")
                .data(simulationDetectionsData)
                .build()
        );
    }
}
