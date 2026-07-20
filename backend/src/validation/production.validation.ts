import Joi from 'joi';

const productionSchema = Joi.object({
  cattleId: Joi.string().uuid().required(),
  productName: Joi.string().valid('MILK', 'MEAT').required(),
  quantity: Joi.number().greater(0).required(),
  productionDate: Joi.date().iso().required(),
  milkingSession: Joi.when('productName', {
    is: 'MILK',
    then: Joi.string().valid('MORNING', 'EVENING').required(),
    otherwise: Joi.string().valid('MORNING', 'EVENING').allow(null, '').optional(),
  }),
  expirationDate: Joi.when('productName', {
    is: 'MILK',
    then: Joi.date().iso().allow(null).optional(),
    otherwise: Joi.date().iso().allow(null).optional(),
  }),
});

const validateProduction = (payload: any) =>
  productionSchema.validate(payload, { abortEarly: false });

export default validateProduction;
