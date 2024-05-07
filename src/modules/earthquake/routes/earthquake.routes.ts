import express from "express";
import {userAuthenticator} from "../../../middlewares/authenticator";
import {EarthquakeController} from "../controllers/earthquake.controller";

const router = express.Router();

router.get('/verified/paginated', userAuthenticator(), EarthquakeController.getPaginatedEarthquakes);
router.get('/predicted/paginated', userAuthenticator(), EarthquakeController.getPredictedEarthquakes);

export default router;
