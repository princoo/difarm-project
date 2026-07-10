import Joi from "joi";

const cattleSchema = Joi.object({
    tagNumber: Joi.string().min(3).trim().required(),
    breed: Joi.string().min(3).trim().required(),
    gender: Joi.string().valid('Bull', 'Cow', 'Other').required(),
    birthOrigin: Joi.string().valid('OnFarm', 'Purchased').required(),
    DOB: Joi.when('birthOrigin', {
        is: 'OnFarm',
        then: Joi.date().iso().required(),
        otherwise: Joi.date().iso().allow(null).optional(),
    }),
    weight: Joi.number().positive().required(),
    location: Joi.string().min(3).trim().required(),
    farmId: Joi.string().uuid().required(),
    lastCheckupDate: Joi.date().iso().required(),
    vaccineHistory: Joi.string().trim().allow('', null).optional(),
    previousOwner: Joi.when('birthOrigin', {
        is: 'Purchased',
        then: Joi.string().min(3).trim().required(),
        otherwise: Joi.string().allow(null, '').optional(),
    }),
    purchaseDate: Joi.when('birthOrigin', {
        is: 'Purchased',
        then: Joi.date().iso().required(),
        otherwise: Joi.date().iso().allow(null).optional(),
    }),
    price: Joi.when('birthOrigin', {
        is: 'Purchased',
        then: Joi.number().positive().required(),
        otherwise: Joi.number().allow(null).optional(),
    }),
    motherTag: Joi.when('birthOrigin', {
        is: 'OnFarm',
        then: Joi.string().min(3).trim().allow(null, '').optional(),
        otherwise: Joi.valid(null, '').optional(),
    }),
});

const validateForm = (schema: Joi.ObjectSchema<any>) => (payload: any) => schema.validate(payload, { abortEarly: false });
const cattleValidation = validateForm(cattleSchema);

export default cattleValidation;
