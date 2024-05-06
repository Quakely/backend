import express from "express";
import {userAuthenticator} from "../../../middlewares/authenticator";
import {EarthquakeController} from "../controllers/earthquake.controller";

const router = express.Router();

router.get('/paginated', userAuthenticator(), EarthquakeController.getPaginatedEarthquakes);

export default router;
