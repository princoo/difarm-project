import Joi from 'joi';

const newProdInfoSchema = Joi.object({
    productType: Joi.string().valid('MILK','MEAT','DUNG','LIQUIDMANURE').required(),
    totalQuantity: Joi.number().greater(0).required(),
    pricePerUnit: Joi.number().greater(0).required(),
});
const updatenewProdInfoSchema = Joi.object({
    productType: Joi.string().valid('MILK','MEAT'),
    totalQuantity: Joi.number().greater(0),
    pricePerUnit: Joi.number().greater(0),
});

export default {newProdInfoSchema, updatenewProdInfoSchema};
