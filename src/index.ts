import 'reflect-metadata';

import {container, InjectionToken} from "tsyringe";
import {ConfigurationService} from "./lib/configuration/configuration.service";
import {QuakelyLogger} from "./lib/logger/logger";
import {QuakelyRedisManager} from "./lib/redis/redis";
import {startQuakelyServer} from "./server";
import {StorageService} from "./lib/storage/storage.service";
import {NotificationService} from "./lib/notification/notification.service";
import {DetectionService} from "./modules/detection/services/detection.service";

export function getService<T>(classType: InjectionToken<T>): T {
    return container.resolve(classType);
}

export function getConfigurationService(): ConfigurationService {
    return getService(ConfigurationService);
}
export function getLogger(): QuakelyLogger {
    return getService(QuakelyLogger);
}
export function getRedisManager(): QuakelyRedisManager {
    return getService(QuakelyRedisManager);
}

export function getDetectionService(): DetectionService {
    return getService(DetectionService);
}
export function getStorageService(): StorageService {
    return getService(StorageService);
}

export function getNotificationService(): NotificationService {
    return getService(NotificationService);
}

startQuakelyServer().then(r => {
    console.log("Quakely server started successfully.")
})
