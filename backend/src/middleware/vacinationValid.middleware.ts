import {Request, Response, NextFunction} from "express"
import vaccinationValidation from "../validation/vaccination.validation";
import veterinValidation from "../validation/veterinarian.validation";
import inserminationValidation from "../validation/insermination.validation";


export const vaccinationValidationMiddleware = (req: Request, res:Response, next: NextFunction) => {
    const { error } = vaccinationValidation(req.body);
    if (error) {
        res.status(400).json({
            status: 400,
            error: error.details.map((detail) => detail.message.replace(/[^a-zA-Z0-9 ]/g, '')),
        });
    } else {
        next();
    }
};

export const veterinValidationMiddleware = (req: Request, res:Response, next: NextFunction) => {
    const { error } = veterinValidation(req.body);
    if (error) {
        res.status(400).json({
            status: 400,
            error: error.details.map((detail) => detail.message.replace(/[^a-zA-Z0-9 ]/g, '')),
        });
    } else {
        next();
    }
};

export const inserminationValidationMiddleware = (req: Request, res:Response, next: NextFunction) => {
    const { error } = inserminationValidation(req.body);
    if (error) {
        res.status(400).json({
            status: 400,
            error: error.details.map((detail) => detail.message.replace(/[^a-zA-Z0-9 ]/g, '')),
        });
    } else {
        next();
    }
};
