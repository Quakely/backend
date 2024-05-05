import {HydratedDocument} from "mongoose";
import {UserDTO} from "../dtos/user.dto";
import {User} from "../models/user.model";

export class UserTransformer {

    private _user!: HydratedDocument<User>;

    constructor(user: HydratedDocument<User>) {
        this._user = user;
    }

    toUserDTO(): UserDTO {
        return {
            id: this._user.anonymous_auth_identifier,
            notification_options: this._user.notification_options,
            coordinates: this._user.location_options.coordinates
        } as UserDTO;
    }
}
