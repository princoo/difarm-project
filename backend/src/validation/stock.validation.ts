import Joi from 'joi';

const stockSchema = Joi.object({
  name: Joi.string().min(2).trim().required(),
  quantity: Joi.number().min(0).required(),
  type: Joi.string()
    .valid('FOOD', 'MEDICATION', 'CONSTRUCTION', 'WATER', 'FEED_ACCESSORIES', 'HYGIENE_MATERIALS')
    .required(),
  supplierId: Joi.string().allow(null, '').optional(),
  unitOfMeasure: Joi.string()
    .valid('kg', 'liter', 'gram', 'milliliter', 'piece', 'box')
    .optional(),
  unitsPerBox: Joi.number().integer().min(1).allow(null).optional(),
  itemType: Joi.string().valid('consumable', 'asset').optional(),
  defaultPurchasePrice: Joi.number().min(0).allow(null).optional(),
  reorderLevel: Joi.number().integer().min(0).allow(null).optional(),
  status: Joi.string().valid('active', 'inactive').optional(),
  description: Joi.string().allow(null, '').optional(),
  leadTimeDays: Joi.number().integer().min(0).allow(null).optional(),
});

const validateStock = (payload: any) => stockSchema.validate(payload, { abortEarly: false });

export default validateStock;
