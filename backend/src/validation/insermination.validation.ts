import Joi from 'joi';

const inserminationSchema = Joi.object({
    cattleId: Joi.string().required(),
    date: Joi.date().required(),
    method: Joi.string().required(),
    type: Joi.string().required(),
    vetId: Joi.string().required(),
    farmId: Joi.string().required(),
});

const validateForm = (payload: any) => inserminationSchema.validate(payload, { abortEarly: false });

export default validateForm;