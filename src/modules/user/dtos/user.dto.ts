import {NotificationOptions} from "../models/user.model";

export interface RegisterUserDTO {
    coordinates: number[];
    notification_options: NotificationOptions;
}

export interface EditUserDTO {
    coordinates?: number[];
    notification_options?: NotificationOptions;
}

export interface UserDTO {
    id: string;
    coordinates: number[];
    notification_options: NotificationOptions;
}
