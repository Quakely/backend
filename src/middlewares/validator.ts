import {NextFunction, Request, Response} from "express";
import Joi, {ValidationResult} from "joi";
import {StatusCodes} from "http-status-codes";
import {Builder} from "builder-pattern";
import FunctionResponse from "../utils/response";

export const validateRequestBody = (schema: Joi.ObjectSchema) => async (req: Request, res: Response, next: NextFunction) => {
    const result: ValidationResult = schema.validate(req.body);

    if (result.error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
            Builder(FunctionResponse).code(StatusCodes.FORBIDDEN)
                .message("A validation error occurred whilst trying to access the endpoint: " + result.error.message)
                .build());
    }

    next();
};
