export abstract class QuakelyRedisSubscription<T> {
    private _channel!: string;

    constructor(channel: string) {
        this._channel = channel;
    }

    public abstract handleSubscriptionMessage(message: T) : void;


    get channel(): string {
        return this._channel;
    }
}
