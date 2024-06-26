import express, {Request, Response} from "express";
import cors from "cors";
import {StatusCodes} from "http-status-codes";
import {Builder} from "builder-pattern";
import QuakelyServerResponse from "./utils/response";
import {container} from "tsyringe";
import {ConfigurationService} from "./lib/configuration/configuration.service";
import {QuakelyLogger} from "./lib/logger/logger";
import mongoose from "mongoose";
import http from "http";
import {getConfigurationService, getDetectionService, getLogger} from "./index";
import userRoutes from "./modules/user/routes/user.routes";
import earthquakeRoutes from "./modules/earthquake/routes/earthquake.routes";
import {getEarthquakeTrackingService} from "./modules/earthquake";
import 'dotenv/config'
import detectionRoutes from "./modules/detection/routes/detection.routes";
import {DetectionService} from "./modules/detection/services/detection.service";

const app = express();

const corsOptions: cors.CorsOptions = {
    origin: '*'
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const setupRoutes = (app: express.Application) => {
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.get('/', async (req: Request, res: Response) => {
        return res.status(StatusCodes.OK).json(Builder(QuakelyServerResponse)
            .code(StatusCodes.OK)
            .message("The quakely server is up and running. 🚀")
            .build())
    });

    app.get('/proxy-earthquakes', async (req: Request, res: Response) => {
        const response = await fetch("http://localhost:8000/earthquakes", {
            method: "GET",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        console.log(response);

        if(response.ok) {
            console.log("respones is ok");
            const responseJson = await response.json();
            console.log(responseJson);
            return res.status(StatusCodes.OK).json(responseJson);
        } else {
            console.log(response.status);
        }
    });

    app.use('/users', userRoutes);
    app.use('/earthquakes', earthquakeRoutes);
    app.use('/detections', detectionRoutes);
}

const registerServices = async () => {
    container.register<ConfigurationService>(ConfigurationService, {useValue:
            new ConfigurationService({
                redisURL: process.env.REDIS_URI,
                loggerToken: process.env.LOGGER_TOKEN,
                kafkaBroker: process.env.KAFKA_BROKER,
                kafkaClientId: process.env.KAFKA_CLIENT_ID,
                mongoURL: process.env.MONGO_URI,
                databaseName: process.env.DATABASE_NAME,
                googleMapsAPIKey: process.env.GOOGLE_MAPS_API_KEY
            })
    });

    container.register<QuakelyLogger>(QuakelyLogger, {useValue:
            new QuakelyLogger(
                getConfigurationService().options.loggerToken!
            )
    });
    container.register<DetectionService>(DetectionService, {useValue:
        new DetectionService()
    })

    console.log(getConfigurationService().options)

    await mongoose.connect(getConfigurationService().options.mongoURL!, { dbName: getConfigurationService().options.databaseName! });
    mongoose.set('debug', false);
}

export const startQuakelyServer = async (): Promise<void> => {
    try {
        registerServices().then(r => {
            http.createServer(app).listen(4000, () => {
                getLogger().logger.info("Server started on port 4000");
                setupRoutes(app);

                getEarthquakeTrackingService().startEarthquakeTracking();
                getDetectionService().registerListener();
            });
        })
    } catch (error) {
        getLogger().logger.error(error);
        process.exit(1);
    }
};
