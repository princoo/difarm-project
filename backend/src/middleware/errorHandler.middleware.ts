import { ErrorRequestHandler, Request, Response, NextFunction } from "express";

const ErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
    const errStatus: number = err.statusCode || 500;
    const errMsg: string = err.message || 'Internal Server Error';

    res.status(errStatus).json({
        code: errStatus,
        message: errMsg,
        error: err,
    });
};

export default ErrorHandler;
