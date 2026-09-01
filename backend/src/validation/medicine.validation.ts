import Joi from "joi";

const units = ["GRAMS", "LITERS", "PIECES"];
const itemTypes = ["MEDICINE", "TOOL"];

const medicineItemSchema = Joi.object({
  name: Joi.string().trim().min(1).required(),
  itemType: Joi.string()
    .valid(...itemTypes)
    .default("MEDICINE"),
  diseaseName: Joi.when("itemType", {
    is: "TOOL",
    then: Joi.string().trim().allow("").optional().default(""),
    otherwise: Joi.string().trim().min(1).required(),
  }),
  quantity: Joi.number().greater(0).required(),
  unit: Joi.string()
    .valid(...units)
    .required(),
  cost: Joi.number().min(0).required(),
});

const createMedicineSchema = Joi.object({
  name: Joi.string().trim().min(1).required(),
  itemType: Joi.string()
    .valid(...itemTypes)
    .default("MEDICINE"),
  diseaseName: Joi.when("itemType", {
    is: "TOOL",
    then: Joi.string().trim().allow("").optional().default(""),
    otherwise: Joi.string().trim().min(1).required(),
  }),
  quantity: Joi.number().greater(0).required(),
  unit: Joi.string()
    .valid(...units)
    .required(),
  cost: Joi.number().min(0).required(),
  purchaseDate: Joi.date().iso().required(),
  farmId: Joi.string().required(),
});

const createMedicineBatchSchema = Joi.object({
  farmId: Joi.string().required(),
  purchaseDate: Joi.date().iso().required(),
  medicines: Joi.array().items(medicineItemSchema).min(1).required(),
});

const updateMedicineSchema = Joi.object({
  name: Joi.string().trim().min(1),
  itemType: Joi.string().valid(...itemTypes),
  diseaseName: Joi.string().trim().allow(""),
  quantity: Joi.number().min(0),
  unit: Joi.string().valid(...units),
  cost: Joi.number().min(0),
  purchaseDate: Joi.date().iso(),
}).min(1);

const createUsageSchema = Joi.object({
  medicineId: Joi.string().required(),
  cattleId: Joi.string().optional(),
  livestockId: Joi.string().optional(),
  quantity: Joi.number().greater(0).required(),
  diseaseName: Joi.string().trim().min(1).required(),
  date: Joi.date().iso().required(),
  farmId: Joi.string().required(),
  toolId: Joi.string().allow(null, "").optional(),
  toolQuantity: Joi.when("toolId", {
    is: Joi.string().min(1),
    then: Joi.number().greater(0).default(1),
    otherwise: Joi.number().greater(0).allow(null).optional(),
  }),
})
  // The treated animal is either a cow or a non-cattle animal, never both.
  .xor("cattleId", "livestockId")
  .messages({
    "object.missing": "Select the animal being treated",
    "object.xor": "A treatment can reference only one animal",
  });

const updateUsageSchema = Joi.object({
  medicineId: Joi.string(),
  cattleId: Joi.string(),
  livestockId: Joi.string(),
  quantity: Joi.number().greater(0),
  diseaseName: Joi.string().trim().min(1),
  date: Joi.date().iso(),
  toolId: Joi.string().allow(null, "").optional(),
  toolQuantity: Joi.number().greater(0).allow(null).optional(),
})
  .min(1)
  .oxor("cattleId", "livestockId")
  .messages({
    "object.oxor": "A treatment can reference only one animal",
  });

export default {
  createMedicineSchema,
  createMedicineBatchSchema,
  updateMedicineSchema,
  createUsageSchema,
  updateUsageSchema,
};
