import Joi from "joi";

const newTransactionSchame = Joi.object({
  productType: Joi.string()
    .valid("MILK", "MEAT", "DUNG", "LIQUIDMANURE")
    .required(),
  quantity: Joi.number().greater(0).required(),
  /** Production day being sold (YYYY-MM-DD) */
  date: Joi.date().iso().required(),
  consumer: Joi.string().required(),
  /** Amount paid now; defaults to full sale value if omitted */
  amountPaid: Joi.number().min(0).optional(),
});

const updateTransactionSchame = Joi.object({
  productType: Joi.string().valid("MILK", "MEAT", "DUNG", "LIQUIDMANURE"),
  quantity: Joi.number().greater(0),
  date: Joi.date().iso(),
  consumer: Joi.string(),
  amountPaid: Joi.number().min(0),
});

export default { newTransactionSchame, updateTransactionSchame };
