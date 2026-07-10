import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

export default function validate(schema:any) {
    return (req:Request, res: Response, next:NextFunction) => {
      const Validate = schema.validate(req.body);
  
      if (Validate.error) {
        res.status(406).send({
          code: 406,
          error: Validate.error.message,
        });
      } else {
        next();
      }
    };
  }
  