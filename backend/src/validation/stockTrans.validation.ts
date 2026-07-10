import Joi from 'joi';

const transactionSchema = Joi.object({
  stockId: Joi.string().required(),
  quantity: Joi.number().positive().required(),
  type: Joi.string().valid('ADDITION', 'CONSUME').required(),
  reference: Joi.string().allow(null, '').optional(),
  reason: Joi.string().allow(null, '').optional(),
  unitCost: Joi.number().min(0).allow(null).optional(),
  expiryDate: Joi.date().allow(null).optional(),
  expiryNote: Joi.string().allow(null, '').optional(),
  status: Joi.string().valid('CONFIRMED', 'DRAFT', 'CANCELLED').optional(),
  supplierId: Joi.string().allow(null, '').optional(),
  date: Joi.date().optional(),
});

const validateTransaction = (payload: any) => transactionSchema.validate(payload, { abortEarly: false });

export default validateTransaction;
