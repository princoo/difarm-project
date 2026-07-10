import Joi from 'joi';

const newWasteLogSchema = Joi.object({
    date: Joi.date().iso().required(),
    quantity: Joi.number().positive().required(),
    type: Joi.string().valid('DUNG','LIQUIDMANURE').required(),
});

export default {newWasteLogSchema}