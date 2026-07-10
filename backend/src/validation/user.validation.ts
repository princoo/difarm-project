import Joi from "joi"

const userSchema = Joi.object({
    fullname: Joi.string().min(3).trim().required(),
    username: Joi.string().min(3).trim().required(),
    email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'org', 'co'] } }).trim().required(),
    gender: Joi.string().required(),
    farmId:Joi.string(),
    phone:Joi.string().trim(),
    password: Joi.string().min(8).max(15).regex(/[0-9a-zA-Z]*\d[0-9a-zA-Z]*/).required(),
});
const validateForm = (schema:  Joi.ObjectSchema<any>) => (payload:any) => schema.validate(payload, { abortEarly: false });
const userValidation = validateForm(userSchema);


export default userValidation;