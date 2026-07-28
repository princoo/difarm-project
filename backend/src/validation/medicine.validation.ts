import Joi from "joi";

const units = ["GRAMS", "LITERS"];

const createMedicineSchema = Joi.object({
  name: Joi.string().trim().min(1).required(),
  diseaseName: Joi.string().trim().min(1).required(),
  quantity: Joi.number().greater(0).required(),
  unit: Joi.string()
    .valid(...units)
    .required(),
  cost: Joi.number().min(0).required(),
  purchaseDate: Joi.date().iso().required(),
  farmId: Joi.string().required(),
});

const medicineItemSchema = Joi.object({
  name: Joi.string().trim().min(1).required(),
  diseaseName: Joi.string().trim().min(1).required(),
  quantity: Joi.number().greater(0).required(),
  unit: Joi.string()
    .valid(...units)
    .required(),
  cost: Joi.number().min(0).required(),
});

const createMedicineBatchSchema = Joi.object({
  farmId: Joi.string().required(),
  purchaseDate: Joi.date().iso().required(),
  medicines: Joi.array().items(medicineItemSchema).min(1).required(),
});

const updateMedicineSchema = Joi.object({
  name: Joi.string().trim().min(1),
  diseaseName: Joi.string().trim().min(1),
  quantity: Joi.number().min(0),
  unit: Joi.string().valid(...units),
  cost: Joi.number().min(0),
  purchaseDate: Joi.date().iso(),
}).min(1);

const createUsageSchema = Joi.object({
  medicineId: Joi.string().required(),
  cattleId: Joi.string().required(),
  quantity: Joi.number().greater(0).required(),
  diseaseName: Joi.string().trim().min(1).required(),
  date: Joi.date().iso().required(),
  farmId: Joi.string().required(),
});

const updateUsageSchema = Joi.object({
  medicineId: Joi.string(),
  cattleId: Joi.string(),
  quantity: Joi.number().greater(0),
  diseaseName: Joi.string().trim().min(1),
  date: Joi.date().iso(),
}).min(1);

export default {
  createMedicineSchema,
  createMedicineBatchSchema,
  updateMedicineSchema,
  createUsageSchema,
  updateUsageSchema,
};
