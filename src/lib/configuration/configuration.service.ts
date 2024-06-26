import {injectable, singleton} from "tsyringe";

export interface ConfigurationOptions {
    redisURL?: string;
    loggerToken?: string;
    mongoURL?: string;
    kafkaClientId?: string;
    kafkaBroker?: string;
    databaseName?: string;
    googleMapsAPIKey?: string;
}


@singleton()
@injectable()
export class ConfigurationService {

    private readonly _defaultOptions: ConfigurationOptions = {
        redisURL: "redis://localhost:6379",
        loggerToken: "iiebvMxbacDjX29Ls1CAftUi",
        kafkaClientId: "quakely",
        kafkaBroker: "127.0.0.1:29092",
        mongoURL: "mongodb+srv://internalizable:VWrSgL4vFwxZ6QqW@quakely.y8qjey5.mongodb.net/?retryWrites=true&w=majority&appName=quakely",
        databaseName: "quakely"
    };

    private readonly _options: ConfigurationOptions;

    constructor(options?: ConfigurationOptions) {
        this._options = {
            ...this._defaultOptions,
            ...options,
        };
    }

    get options(): ConfigurationOptions {
        return this._options;
    }
}
