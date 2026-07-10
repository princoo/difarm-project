import Joi from "joi";

const accountSchema = Joi.object({
  username: Joi.string().min(3).trim(),
  email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'org', 'co'] } }).trim(),
  phone:Joi.string().trim(),

});

export default { accountSchema };
