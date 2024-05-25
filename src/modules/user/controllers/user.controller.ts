import {Request, Response} from "express"
import {StatusCodes} from "http-status-codes";
import {Builder} from "builder-pattern";
import {HydratedDocument} from "mongoose";
import {User} from "../models/user.model";
import {EditUserDTO, RegisterUserDTO} from "../dtos/user.dto";
import {UserTransformer} from "../transformers/user.transformer";
import {getUserService} from "../index";
import QuakelyServerResponse from "../../../utils/response";

export class UserController {
    static registerUser = async (req: Request, res: Response) => {
        const registerBody = req.body as RegisterUserDTO;
        const user = await getUserService().createUser(registerBody);

        if(user) {
            return res.status(StatusCodes.OK).json(
                Builder(QuakelyServerResponse)
                    .code(StatusCodes.OK)
                    .message("Successfully registered the user")
                    .data(new UserTransformer(user).toUserDTO())
                    .build()
            )
        } else {
            return res.status(StatusCodes.OK).json(
                Builder(QuakelyServerResponse)
                    .code(StatusCodes.INTERNAL_SERVER_ERROR)
                    .message("Could not register a new user")
                    .build()
            )
        }
    }
    static getUserInformation = async (req: Request, res: Response) => {
        const user = res.locals.user as HydratedDocument<User>;

        return res.status(StatusCodes.OK).json(
            Builder(QuakelyServerResponse)
                .code(StatusCodes.OK)
                .message("Successfully fetched the user")
                .data(new UserTransformer(user).toUserDTO())
                .build()
        )
    }
    static updateUser = async (req: Request, res: Response) => {
        const user = res.locals.user as HydratedDocument<User>;

        const updatedUser = await getUserService().updateUser(user, req.body as EditUserDTO);

        if(updatedUser) {
            return res.status(StatusCodes.OK).json(
                Builder(QuakelyServerResponse)
                    .code(StatusCodes.OK)
                    .message("Successfully updated the user")
                    .data(new UserTransformer(user).toUserDTO())
                    .build()
            )
        } else {
            return res.status(StatusCodes.OK).json(
                Builder(QuakelyServerResponse)
                    .code(StatusCodes.INTERNAL_SERVER_ERROR)
                    .message("Could not update the user")
                    .build()
            )
        }
    }
    static deleteUser = async (req: Request, res: Response) => {
        const user = res.locals.user as HydratedDocument<User>;

        if(user.disabled) {
            return res.status(StatusCodes.CONFLICT).json(
                Builder(QuakelyServerResponse)
                    .code(StatusCodes.CONFLICT)
                    .message("The user hsa already been deleted.")
                    .build()
            )
        }

        user.disabled = true;
        await user.save();

        return res.status(StatusCodes.OK).json(
            Builder(QuakelyServerResponse)
                .code(StatusCodes.OK)
                .message("The user has been deleted.")
                .build()
        )
    }
}
