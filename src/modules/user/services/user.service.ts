import {injectable, singleton} from "tsyringe";
import {HydratedDocument} from "mongoose";
import {EditUserDTO, RegisterUserDTO} from "../dtos/user.dto";
import {UserModel} from "../../models";
import {User} from "../models/user.model";
import { v4 as uuidv4 } from 'uuid';

@singleton()
@injectable()
export class UserService {
    public createUser = async(userInformation: RegisterUserDTO): Promise<HydratedDocument<User>> => {
        return UserModel.create({
            ...userInformation,
            anonymous_auth_identifier: uuidv4(),
            location_options: {
                type: "Point",
                coordinates: userInformation.coordinates
            }
        });
    }
    public getUserByAuthenticationToken = async(authenticationToken: string): Promise<HydratedDocument<User> | null> => {
        return UserModel.findOne({
            anonymous_auth_identifier: authenticationToken
        }).exec();
    }
    public updateUser = async(user: HydratedDocument<User>, editUserDTO: EditUserDTO): Promise<HydratedDocument<User> | null> => {
        let updatedFields: any = {
            ...editUserDTO
        }

        if(editUserDTO.coordinates) {
            updatedFields = {
                ...updatedFields,
                location_options: {
                    type: "Point",
                    coordinates: editUserDTO.coordinates
                }
            }
        }
        return await UserModel.findByIdAndUpdate(user._id, updatedFields, {new: true}).exec();
    }
}
