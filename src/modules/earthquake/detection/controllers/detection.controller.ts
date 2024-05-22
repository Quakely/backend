import {Request, Response} from "express";
import {Detection} from "../detection.model";
import {StatusCodes} from "http-status-codes";
import QuakelyServerResponse from "../../../../utils/response";
import {Builder} from "builder-pattern";
import {DetectionService} from "../../../../lib/detection/detection.service";

export class DetectionController {
    static publishDetection = async (req: Request, res: Response) => {
        const service = new DetectionService();
        const detection: Detection = {
            latitude: req.body.latitude,
            longitude: req.body.longitude,
            deltaX: req.body.deltaX,
            deltaY: req.body.deltaY,
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
}
