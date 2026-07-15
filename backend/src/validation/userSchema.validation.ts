import Joi from "joi";

/** Used for PUT /users/:userId — all fields optional; only provided ones are validated. */
const userSchema = Joi.object({
  fullname: Joi.string().trim().min(3).optional(),
  gender: Joi.string()
    .valid("MALE", "FEMALE")
    .optional()
    .allow("", null),
  username: Joi.string().trim().min(3).optional().allow(""),
  email: Joi.string()
    .trim()
    .email({ tlds: { allow: false } })
    .optional()
    .allow("", null),
  phone: Joi.alternatives()
    .try(Joi.string().trim(), Joi.number())
    .optional()
    .allow("", null),
})
  .min(1)
  .unknown(false);

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
