import {getService} from "../../index";
import {UserService} from "./services/user.service";

export const getUserService = (): UserService => {
    return getService(UserService);
}
