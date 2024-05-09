import express from "express";
import {userAuthenticator} from "../../../middlewares/authenticator";
import {EarthquakeController} from "../controllers/earthquake.controller";

const router = express.Router();

router.get('/verified/paginated', userAuthenticator(), EarthquakeController.getPaginatedEarthquakes);
router.get('/predicted/paginated', userAuthenticator(), EarthquakeController.getPredictedEarthquakes);
router.get('/map', EarthquakeController.getEarthquakesOnMap);

export default router;
