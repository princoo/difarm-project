import Joi from "joi";

const userSchema = Joi.object({
  fullname: Joi.string().min(3),
  gender: Joi.string().valid("MALE", "FEMALE"),
});

const setPasswordSchema = Joi.object({
  password: Joi.string()
    .min(8)
    .max(64)
    .pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)
    .required()
    .messages({
      "string.pattern.base":
        "Password must include at least one letter and one number",
      "string.min": "Password must be at least 8 characters",
    }),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "Passwords do not match",
  }),
});

export default { userSchema, setPasswordSchema };
