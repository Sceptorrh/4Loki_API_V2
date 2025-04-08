import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from './errorHandler';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body.Birthday) {
        req.body.Birthday = req.body.Birthday.trim();
      }
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        console.error('Validation errors:', errors);
        next(new AppError(`Validation failed: ${JSON.stringify(errors)}`, 400));
      } else {
        next(error);
      }
    }
  };
}; 