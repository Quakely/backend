import {pino, Logger} from "pino"
import {injectable, Lifecycle, scoped} from "tsyringe";

@injectable()
@scoped(Lifecycle.ContainerScoped)
export class QuakelyLogger {
    private readonly _logger: Logger;

    constructor(token: string) {
        const transport = pino.transport({
            target: "@logtail/pino",
            options: {sourceToken: token}
        });

        this._logger = pino(transport);
    }

    get logger(): Logger {
        return this._logger;
    }
}
