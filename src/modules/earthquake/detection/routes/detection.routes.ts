import express from "express";
import {userAuthenticator} from "../../../../middlewares/authenticator";
import {DetectionController} from "../controllers/detection.controller";

const router = express.Router();

router.get('/pipe', userAuthenticator(), DetectionController.publishDetection);
router.get('/simulate', DetectionController.simulateEarthquake);

export default router;
