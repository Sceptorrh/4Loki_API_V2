import { Request, Response, NextFunction } from 'express';

/**
 * Keep dates in UTC format in request body
 */
export const convertDatesToUTC = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    Object.entries(req.body).forEach(([key, value]) => {
      // For Birthday field, ensure it's in YYYY-MM-DD format without any conversion
      if (key === 'Birthday' && typeof value === 'string') {
        const match = value.match(/^\d{4}-\d{2}-\d{2}/);
        if (match) {
          req.body[key] = match[0];
        }
        return;
      }
      
      // For other date fields, keep them in UTC
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        req.body[key] = value;
      }
    });
  }
  next();
};

/**
 * Keep dates in UTC format in response
 */
export const convertDatesInResponse = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json;
  res.json = function (body) {
    if (body && typeof body === 'object') {
      const convertDates = (obj: any) => {
        Object.entries(obj).forEach(([key, value]) => {
          // For Birthday field, ensure we return just the date part
          if (key === 'Birthday' && value instanceof Date) {
            obj[key] = value.toISOString().split('T')[0];
            return;
          }
          
          // For other dates, return UTC ISO string
          if (value instanceof Date) {
            obj[key] = value.toISOString();
          } else if (value && typeof value === 'object') {
            convertDates(value);
          }
        });
      };
      
      if (Array.isArray(body)) {
        body.forEach(item => convertDates(item));
      } else {
        convertDates(body);
      }
    }
    return originalJson.call(this, body);
  };
  next();
};

/**
 * SQL helper to keep dates in UTC in queries
 */
export const convertDateFieldsToUTC = (fields: string[]) => {
  return fields.map(field => {
    // For Birthday field, just return the date part without any conversion
    if (field === 'Birthday') {
      return `DATE(${field}) as ${field}`;
    }
    // For other date fields, keep them in UTC
    return `CONVERT_TZ(${field}, @@session.time_zone, '+00:00') as ${field}`;
  }).join(', ');
}; 