import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  if (err.status) {
    return res.status(err.status).json({
      error: err.name || 'Error',
      message: err.message,
      code: err.code || 'UNKNOWN_ERROR',
    });
  }

  // Default 500 error
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
  });
};
