import Joi from "joi";

/** Signup body for veterinarian accounts (gender optional). */
const veterinarianSignupSchema = Joi.object({
  fullname: Joi.string().min(3).trim().required(),
  username: Joi.string().min(3).trim().required(),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .trim()
    .required(),
  gender: Joi.string().valid("MALE", "FEMALE").optional().allow("", null),
  farmId: Joi.string().required(),
  phone: Joi.string().trim().optional().allow("", null),
  password: Joi.string()
    .min(8)
    .max(64)
    .pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)
    .required()
    .messages({
      "string.pattern.base":
        "Password must include at least one letter and one number",
    }),
});

const validateForm =
  (schema: Joi.ObjectSchema<any>) => (payload: any) =>
    schema.validate(payload, { abortEarly: false });

export default validateForm(veterinarianSignupSchema);
