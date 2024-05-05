import express from "express";
import {userAuthenticator} from "../../../middlewares/authenticator";
import {UserController} from "../controllers/user.controller";
import {UserSchemas} from "../schemas/user.schemas";
import {validateRequestBody} from "../../../middlewares/validator";

const router = express.Router();

router.get('/', userAuthenticator(), UserController.getUserInformation);
router.post('/register', validateRequestBody(UserSchemas.getRegisterSchema()), UserController.registerUser);
router.put('/edit', userAuthenticator(), validateRequestBody(UserSchemas.getEditSchema()), UserController.updateUser);
router.delete('/delete', userAuthenticator(), UserController.deleteUser);

export default router;
