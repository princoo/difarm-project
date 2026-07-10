import { NextFunction, Request, Response } from "express";
import userValidation from "../validation/user.validation";

const signupValidation = (req: Request, res:Response, next: NextFunction) => {
    const { error } = userValidation(req.body);
    if (error) {
        res.status(400).json({
            status: 400,
            error: error.details.map((detail) => detail.message.replace(/[^a-zA-Z0-9 ]/g, '')),
        });
    } else {
        next();
    }
};

export default signupValidation;
