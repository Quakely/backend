import {Request, Response} from "express";
import {StatusCodes} from "http-status-codes";
import {Builder} from "builder-pattern";
import {HydratedDocument} from "mongoose";
import {User} from "../../user/models/user.model";
import {getDetectionService} from "../../../index";
import QuakelyServerResponse from "../../../utils/response";
import {DetectionDTO} from "../dtos/detection.dto";
import {v4 as uuidv4} from "uuid";

export class DetectionController {
    static publishDetection = async (req: Request, res: Response) => {
        const service = getDetectionService();
        const detection: DetectionDTO = {
            latitude: req.body.latitude,
            longitude: req.body.longitude,
            deltaX: req.body.deltaX,
            deltaY: req.body.deltaY,
            deviceId: uuidv4(),
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
