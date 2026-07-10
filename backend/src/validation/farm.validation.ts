import Joi from 'joi';

const farmSchema = Joi.object({
    name: Joi.string().min(3).required(),
    location: Joi.string().min(3).required(),
    size: Joi.number().positive().required(),
    type: Joi.string().required(),
    ownerId: Joi.string().optional(),
    registrationNo: Joi.string().allow('', null).optional(),
    description: Joi.string().allow('', null).optional(),
    yearEstablished: Joi.number().integer().min(1900).max(new Date().getFullYear()).optional(),
    grazingArea: Joi.number().min(0).optional(),
    housingCapacity: Joi.number().integer().min(0).optional(),
    primaryLivestock: Joi.string().allow('', null).optional(),
    breeds: Joi.string().allow('', null).optional(),
    herdSizeEstimate: Joi.number().integer().min(0).optional(),
    contactPhone: Joi.string().allow('', null).optional(),
    contactEmail: Joi.string().email().allow('', null).optional(),
    emergencyContact: Joi.string().allow('', null).optional(),
    landmarks: Joi.string().allow('', null).optional(),
    latitude: Joi.string().allow('', null).optional(),
    longitude: Joi.string().allow('', null).optional(),
    waterSource: Joi.string().allow('', null).optional(),
    hasElectricity: Joi.boolean().optional(),
    veterinaryAccess: Joi.string().allow('', null).optional(),
});

const validateFarm = (payload: any) => farmSchema.validate(payload, { abortEarly: false });

export default validateFarm;
