import { NextFunction, Request, Response } from "express";
import veterinarianSignupValidation from "../validation/veterinarianSignup.validation";

const veterinarianSignupValidationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error } = veterinarianSignupValidation(req.body);
  if (error) {
    return res.status(400).json({
      status: 400,
      message: error.details
        .map((detail) => detail.message.replace(/[^a-zA-Z0-9 ]/g, ""))
        .join(". "),
      error: error.details.map((detail) =>
        detail.message.replace(/[^a-zA-Z0-9 ]/g, "")
      ),
    });
  }
  next();
};

export default veterinarianSignupValidationMiddleware;
