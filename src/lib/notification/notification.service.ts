import { Client as OneSignalClient } from 'onesignal-node';
import {injectable, singleton} from "tsyringe";

@singleton()
@injectable()
export class NotificationService {
    private readonly _oneSignalClient: OneSignalClient;

    constructor() {
        this._oneSignalClient = new OneSignalClient('3fece6ef-a3f0-48f8-b2f9-e4fbb3a96d0e', 'Yzg2NTBjNjQtZTIyYi00YTk2LTlkMGMtYTNlN2I5OTlmYzY4')
    }

    get oneSignalClient(): OneSignalClient {
        return this._oneSignalClient;
    }
}
