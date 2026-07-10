import Joi from "joi";

const userSchema = Joi.object({
  fullname: Joi.string().min(3),
  gender: Joi.string().valid("MALE", "FEMALE"),
});

export default { userSchema };
