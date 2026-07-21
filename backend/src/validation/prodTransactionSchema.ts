import Joi from "joi";

const usageCategories = ["SOLD_TO_DAIRY", "USED_ON_FARM", "CONSUMED_BY_UMUCUNDA"];

const newTransactionSchame = Joi.object({
  productType: Joi.string()
    .valid("MILK", "MEAT", "DUNG", "LIQUIDMANURE")
    .required(),
  usageCategory: Joi.string()
    .valid(...usageCategories)
    .default("SOLD_TO_DAIRY"),
  quantity: Joi.number().greater(0).required(),
  /** Production day being used/sold (YYYY-MM-DD) */
  date: Joi.date().iso().required(),
  /** Dairy name when sold to dairy; optional for on-farm / umucunda */
  consumer: Joi.when("usageCategory", {
    is: "SOLD_TO_DAIRY",
    then: Joi.string().required(),
    otherwise: Joi.string().allow("").optional(),
  }),
  /** Unit price for dairy sales; ignored for non-sale usage */
  unitPrice: Joi.number().min(0).optional(),
  /** Amount paid now; defaults to full dairy revenue if omitted */
  amountPaid: Joi.number().min(0).optional(),
});

const updateTransactionSchame = Joi.object({
  quantity: Joi.number().min(0),
  consumer: Joi.string().allow(""),
  unitPrice: Joi.number().min(0),
  amountPaid: Joi.number().min(0),
});

const batchUsageSchema = Joi.object({
  productType: Joi.string()
    .valid("MILK", "MEAT", "DUNG", "LIQUIDMANURE")
    .required(),
  date: Joi.date().iso().required(),
  usages: Joi.array()
    .items(
      Joi.object({
        usageCategory: Joi.string()
          .valid(...usageCategories)
          .required(),
        quantity: Joi.number().min(0).required(),
        consumer: Joi.string().allow("").optional(),
        unitPrice: Joi.number().min(0).optional(),
        amountPaid: Joi.number().min(0).optional(),
      })
    )
    .min(1)
    .required(),
});

export default {
  newTransactionSchame,
  updateTransactionSchame,
  batchUsageSchema,
};
