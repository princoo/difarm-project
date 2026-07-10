import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import prisma from '../db/prisma';

const checkRole = (requiredRoles: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user.data.id;

            const user = await prisma.account.findUnique({ where: {id: userId}});
            

            if (!user || !requiredRoles.includes(user.role)) {
                return res.status(StatusCodes.FORBIDDEN).json({ message: 'Forbidden' });
            }


            next();
        } catch (error) {
            
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
        }
    };
};

export default checkRole;
