import Joi from 'joi';

const productionSchema = Joi.object({
    cattleId: Joi.string().uuid().required(),
    productName: Joi.string().valid('MILK','MEAT').required(),
    quantity: Joi.number().greater(0).required(),
    productionDate: Joi.date().iso().required(),
    expirationDate: Joi.date().iso().allow(null)
});

const validateProduction = (payload: any) => productionSchema.validate(payload, { abortEarly: false });

export default validateProduction;
