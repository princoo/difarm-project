import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

export default function validate(schema: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (result.error) {
      const message = result.error.details
        .map((d: { message: string }) => d.message.replace(/"/g, ''))
        .join('; ');
      return res.status(StatusCodes.NOT_ACCEPTABLE).json({
        code: StatusCodes.NOT_ACCEPTABLE,
        message,
        error: message,
      });
    }

    req.body = result.value;
    return next();
  };
}
