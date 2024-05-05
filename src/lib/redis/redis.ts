import {injectable, singleton} from "tsyringe";
import Redis from "ioredis";
import {QuakelyRedisSubscription} from "./subscriptions/subscription.";

@singleton()
@injectable()
export class QuakelyRedisManager {
    private _redisClient!: Redis;
    private _subscriberClient!: Redis;
    private _publisherClient!: Redis;

    private channelToSubscriptionInstance: Map<string, QuakelyRedisSubscription<any>> = new Map();

    constructor(redisURL: string, subscriptions: Set<QuakelyRedisSubscription<any>>) {
        this._redisClient = new Redis(redisURL);
        this._subscriberClient = new Redis(redisURL);
        this._publisherClient = new Redis(redisURL);

        subscriptions.forEach(sub => {
            this.channelToSubscriptionInstance.set(sub.channel, sub);
            this._subscriberClient.subscribe(sub.channel);
        });

        this._subscriberClient.on("message", (channel, message) => {
            console.log(`Received message from ${channel}`);

            if (this.channelToSubscriptionInstance.has(channel)) {
                const subscription = this.channelToSubscriptionInstance.get(channel);
                subscription?.handleSubscriptionMessage(message);
            } else {
                console.warn(`No subscription handler for channel: ${channel}`);
            }
        });
    }

    public async getCachedObject<T>(key: string): Promise<T | undefined> {
        const usageResponse = await this._redisClient.get(key)

        if(usageResponse != undefined) {
            return JSON.parse(usageResponse) as T
        }

        return undefined;
    }

    public async cacheObject<T>(key: string, object: T, expiry?: number): Promise<boolean> {
        const stringifiedObject = JSON.stringify(object);

        if(expiry) {
            await this._redisClient.setex(key, expiry, stringifiedObject)
        } else {
            await this._redisClient.set(key, stringifiedObject)
        }

        return true;
    }

    public async deleteCachedObject(key: string): Promise<boolean> {
        await this._redisClient.del(key);
        return true;
    }

    public async getCachedObjectByGroup<T>(group: string, key: string): Promise<T | undefined> {
        const usageResponse = await this._redisClient.hget(group, key)

        if(usageResponse != undefined) {
            return JSON.parse(usageResponse) as T
        }

        return undefined;
    }

    public async setCachedObjectByGroup<T>(group: string, key: string, object: T): Promise<boolean> {
        const stringifiedObject = JSON.stringify(object);
        await this._redisClient.hset(group, key, stringifiedObject)

        return true;
    }

    public async deleteCachedObjectByGroup<T>(group: string, key: string): Promise<boolean> {
        await this._redisClient.hdel(group, key)
        return true;
    }

    public sanitizeKey(key: string) {
        return key.replace(/[^\w\s]/gi, '').replace(/\s+/g, '-').toLowerCase();
    }


    get redisClient(): Redis {
        return this._redisClient;
    }

    get subscriberClient(): Redis {
        return this._subscriberClient;
    }

    get publisherClient(): Redis {
        return this._publisherClient;
    }
}
