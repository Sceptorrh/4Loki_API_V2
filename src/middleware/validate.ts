import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from './errorHandler';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('Validating request body:', JSON.stringify(req.body, null, 2));
      if (req.body.Birthday) {
        console.log('Birthday value:', req.body.Birthday);
        console.log('Birthday length:', req.body.Birthday.length);
        console.log('Birthday char codes:', [...req.body.Birthday].map(c => c.charCodeAt(0)));
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