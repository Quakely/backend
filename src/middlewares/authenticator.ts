import {NextFunction, Request, Response} from 'express';
import {StatusCodes} from "http-status-codes";
import {Builder} from "builder-pattern";
import QuakelyServerResponse from "../utils/response";
import {getUserService} from "../modules/user";

export const userAuthenticator = (force: boolean = true) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const token = req.headers["authorization"];

        if (!token) {
            if(force) {
                res.status(StatusCodes.FORBIDDEN)
                    .json(Builder(QuakelyServerResponse)
                        .code(StatusCodes.FORBIDDEN)
                        .message("A token is required for authentication")
                        .build());
            } else {
                await next();
            }

            return;
        }

        try {
            const user = await getUserService().getUserByAuthenticationToken(token)

            if (!user) {
                res.status(StatusCodes.NOT_FOUND)
                    .json(Builder(QuakelyServerResponse)
                        .code(StatusCodes.NOT_FOUND)
                        .message("The user authenticated has not been found.")
                        .build());

                return;
            }

            res.locals.user = user;
            res.locals.token = token;
            await next();
        } catch (err) {
            res.status(StatusCodes.FORBIDDEN)
                .json(Builder(QuakelyServerResponse)
                    .code(StatusCodes.FORBIDDEN)
                    .message("The provided token is invalid.")
                    .build());
        }
    }
}
