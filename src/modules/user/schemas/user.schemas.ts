import {configuredJoi} from "../../../utils/joi";

export class UserSchemas {
    static getRegisterSchema = () => {
        return configuredJoi.object({
            notification_options: configuredJoi.object({
                enabled: configuredJoi.boolean(),
                token: configuredJoi.string()
            }).required(),
            coordinates: configuredJoi.array().items(
                configuredJoi.number().required()
            ).length(2).required()
        });
    }

    static getEditSchema = () => {
        return configuredJoi.object({
            notification_options: configuredJoi.object({
                enabled: configuredJoi.boolean(),
                token: configuredJoi.string()
            }),
            coordinates: configuredJoi.array().items(
                configuredJoi.number().required()
            ).length(2)
        });
    }
}
