import express from "express";
import {DetectionController} from "../controllers/detection.controller";
import {userAuthenticator} from "../../../middlewares/authenticator";

const router = express.Router();

router.get('/pipe', userAuthenticator(), DetectionController.publishDetection);
router.get('/simulate', DetectionController.simulateEarthquake);

export default router;
