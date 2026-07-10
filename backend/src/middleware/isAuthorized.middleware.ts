import { NextFunction, Request, Response } from "express"
import { verifyToken } from "../service/token.service";
import { StatusCodes } from "http-status-codes";


const isAuthorized = (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Please authenticate' });
        }

        const decoded = verifyToken(token, "isAuthorized");

        if (!decoded) {
            return res.status(StatusCodes.FORBIDDEN).json({ message: 'Unauthorized' });
        }

        (req as any).user = decoded;
        next();

    } catch (err) {
        res.status(StatusCodes.UNAUTHORIZED).json({message: 'Please authenticate'});
    }
}

export default isAuthorized;