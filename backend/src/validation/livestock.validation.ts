import Joi from "joi";

export const LIVESTOCK_SPECIES = [
  "GOAT",
  "SHEEP",
  "PIG",
  "POULTRY",
  "RABBIT",
  "OTHER",
] as const;

export const LIVESTOCK_STATUSES = [
  "HEALTHY",
  "SICK",
  "SOLD",
  "PROCESSED",
  "DECEASED",
] as const;

export const LIVESTOCK_GENDERS = ["MALE", "FEMALE"] as const;

const livestockSchema = Joi.object({
  tagNumber: Joi.string().min(2).trim().required(),
  species: Joi.string()
    .valid(...LIVESTOCK_SPECIES)
    .required(),
  breed: Joi.string().trim().allow("", null).optional(),
  gender: Joi.string()
    .valid(...LIVESTOCK_GENDERS)
    .required(),
  status: Joi.string()
    .valid(...LIVESTOCK_STATUSES)
    .optional(),
  DOB: Joi.date().iso().allow(null).optional(),
  weight: Joi.number().positive().allow(null).optional(),
  location: Joi.string().trim().allow("", null).optional(),
  farmId: Joi.string().uuid().optional(),
  motherTag: Joi.string().trim().allow("", null).optional(),
});

const updateLivestockSchema = livestockSchema.fork(
  ["tagNumber", "species", "gender"],
  (field) => field.optional()
);

const validateForm =
  (schema: Joi.ObjectSchema<any>) =>
  (payload: any) =>
    schema.validate(payload, { abortEarly: false, stripUnknown: true });

export const livestockValidation = validateForm(livestockSchema);
export const livestockUpdateValidation = validateForm(updateLivestockSchema);

export default livestockValidation;
