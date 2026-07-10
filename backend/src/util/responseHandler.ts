import { Response } from 'express';

class ResponseHandler {
  
  private statusCode: number;
  private message: string;
  private data: any;
  private type: string;

  constructor() {
    this.statusCode = 200;
    this.message = '';
    this.data = null;
    this.type = '';
  }

  setSuccess(statusCode: number, message: string, data: any): void {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.type = 'success';
  }

  setError(statusCode: number, message: string): void {
    this.statusCode = statusCode;
    this.message = message;
    this.type = 'error';
  }

  send(res: Response): void {
    if (this.type === 'success') {
      res.status(this.statusCode).json({
        status: this.statusCode,
        message: this.message,
        data: this.data,
      });
    } else {
      res.status(this.statusCode).json({
        status: this.statusCode,
        message: this.message,
      });
    }
  }
}

export default ResponseHandler;