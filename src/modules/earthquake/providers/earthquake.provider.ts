import {Earthquake, EarthquakeSource} from "../models/earthquake.model";

export abstract class EarthquakeProvider {
    private readonly _sourceURL: string;
    private readonly _quakeSource: EarthquakeSource;

    get sourceURL(): string {
        return this._sourceURL;
    }

    get quakeSource(): EarthquakeSource {
        return this._quakeSource;
    }

    protected constructor(sourceURL: string, quakeSource: EarthquakeSource) {
        this._sourceURL = sourceURL;
        this._quakeSource = quakeSource;
    }

    abstract fetchEarthquakes(): Promise<Earthquake[]>;
}
