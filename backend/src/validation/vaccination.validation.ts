import Joi from 'joi';

const vaccinationSchema = Joi.object({
    cattleId: Joi.string().required(),
    date: Joi.date().required(),
    vaccineType: Joi.string().required(),
    vetId: Joi.string().required(),
    farmId: Joi.string().required(),
    price: Joi.number().min(0).optional().allow(null, ''),
    documentUrl: Joi.string().optional().allow(null, ''),
    documentName: Joi.string().optional().allow(null, ''),
});

const validateFarm = (payload: any) => vaccinationSchema.validate(payload, { abortEarly: false });

export default validateFarm;