import Joi from 'joi'

const forgotPasswordSchema = Joi.object({
    email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'org', 'co'] } }).trim().required(),
});
const resetPasswordSchema = Joi.object({
    newPassword: Joi.string().min(8).max(15).regex(/[0-9a-zA-Z]*\d[0-9a-zA-Z]*/).required(),
});

export default {forgotPasswordSchema, resetPasswordSchema}