import Joi from "joi";

export const configuredJoi = Joi.extend(require('joi-phone-number')).extend(require('@joi/date'));
