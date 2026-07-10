import Joi from 'joi';

const veterinSchema = Joi.object({
    name: Joi.string().min(3).required(),
    email: Joi.string().email().required(),
    farmId: Joi.string().required(),
    phone: Joi.number().min(10).required(),
});

const validateForm = (payload: any) => veterinSchema.validate(payload, { abortEarly: false });

export default validateForm;