import { Request, Response } from 'express';
import { AppError } from '../middleware/errorHandler';
import pool from '../config/database';
import { AnyZodObject } from 'zod';
import { convertDateFieldsToUTC } from '../middleware/dateHandler';
import { getDateFields } from './tableConfig';

export class RouteHandler {
  constructor(
    private tableName: string,
    private validationSchema?: AnyZodObject
  ) {}

  async getAll(req: Request, res: Response) {
    try {
      const dateFields = getDateFields(this.tableName);
      const dateConversion = dateFields.length > 0 ? `, ${convertDateFieldsToUTC(dateFields)}` : '';
      
      const [rows] = await pool.query(`SELECT *${dateConversion} FROM ${this.tableName}`);
      res.json(rows);
    } catch (error) {
      throw new AppError('Error fetching records', 500);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const dateFields = getDateFields(this.tableName);
      const dateConversion = dateFields.length > 0 ? `, ${convertDateFieldsToUTC(dateFields)}` : '';
      
      const [rows] = await pool.query(
        `SELECT *${dateConversion} FROM ${this.tableName} WHERE Id = ?`,
        [req.params.id]
      );
      
      if (!Array.isArray(rows) || rows.length === 0) {
        throw new AppError('Record not found', 404);
      }
      
      res.json(rows[0]);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error fetching record', 500);
    }
  }

  async create(req: Request, res: Response) {
    try {
      if (this.validationSchema) {
        await this.validationSchema.parseAsync(req.body);
      }

      const fields = Object.keys(req.body);
      const values = Object.values(req.body);
      const placeholders = fields.map(() => '?').join(', ');
      
      // Escape column names with backticks
      const escapedFields = fields.map(field => `\`${field}\``).join(', ');
      
      const query = `INSERT INTO ${this.tableName} (${escapedFields}) VALUES (${placeholders})`;
      
      try {
        const [result] = await pool.query(query, values);
        
        // Get date fields for this table from configuration
        const dateFields = getDateFields(this.tableName);
        
        // Only add date conversion if there are date fields
        const dateConversion = dateFields.length > 0 ? `, ${convertDateFieldsToUTC(dateFields)}` : '';
        
        const [newRecord] = await pool.query(
          `SELECT *${dateConversion}
           FROM ${this.tableName} WHERE Id = ?`,
          [(result as any).insertId]
        );
        
        if (!Array.isArray(newRecord) || newRecord.length === 0) {
          throw new AppError('Failed to retrieve newly created record', 500);
        }
        
        res.status(201).json(Array.isArray(newRecord) ? newRecord[0] : newRecord);
      } catch (sqlError) {
        console.error('SQL Error:', {
          code: (sqlError as any).code,
          message: (sqlError as any).sqlMessage,
          state: (sqlError as any).sqlState
        });
        throw new AppError(`Database error: ${(sqlError as any).sqlMessage || 'Unknown error'}`, 500);
      }
    } catch (error) {
      console.error('Error in create method:', error);
      if (error instanceof AppError) throw error;
      if ((error as any).name === 'ZodError') {
        console.error('Validation error:', error);
        throw new AppError('Validation failed: ' + JSON.stringify((error as any).errors), 400);
      }
      throw new AppError('Error creating record', 500);
    }
  }

  async update(req: Request, res: Response) {
    try {
      if (this.validationSchema) {
        await this.validationSchema.parseAsync(req.body);
      }

      const fields = Object.keys(req.body)
        .map(field => `${field} = ?`)
        .join(', ');
      const values = [...Object.values(req.body), req.params.id];
      
      const [result] = await pool.query(
        `UPDATE ${this.tableName} SET ${fields} WHERE Id = ?`,
        values
      );
      
      if ((result as any).affectedRows === 0) {
        throw new AppError('Record not found', 404);
      }
      
      const [updatedRecord] = await pool.query(
        `SELECT * FROM ${this.tableName} WHERE Id = ?`,
        [req.params.id]
      );
      
      res.json(Array.isArray(updatedRecord) ? updatedRecord[0] : updatedRecord);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error updating record', 500);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = req.params.id;
      await pool.query(`DELETE FROM ${this.tableName} WHERE Id = ?`, [id]);
      res.json({ message: `${this.tableName} deleted successfully` });
    } catch (error) {
      console.error(`Error deleting ${this.tableName}:`, error);
      throw new AppError(`Error deleting ${this.tableName}`, 500);
    }
  }

  async deleteAll(req: Request, res: Response) {
    try {
      await pool.query(`DELETE FROM ${this.tableName}`);
      res.json({ message: `All ${this.tableName}s deleted successfully` });
    } catch (error) {
      console.error(`Error deleting all ${this.tableName}s:`, error);
      throw new AppError(`Error deleting all ${this.tableName}s`, 500);
    }
  }

  // Additional methods for specific operations
  async getByCustomerId(req: Request, res: Response) {
    try {
      // First check if the customer exists
      const [customer] = await pool.query(
        'SELECT Id FROM Customer WHERE Id = ?',
        [req.params.customerId]
      );

      if (!Array.isArray(customer) || customer.length === 0) {
        throw new AppError('Customer not found', 404);
      }

      // Then get the dogs
      const [rows] = await pool.query(
        `SELECT * FROM ${this.tableName} WHERE CustomerId = ?`,
        [req.params.customerId]
      );

      if (!Array.isArray(rows)) {
        throw new AppError('Invalid response from database', 500);
      }

      res.json(rows);
    } catch (error) {
      console.error(`Error fetching ${this.tableName} for customer ${req.params.customerId}:`, error);
      if (error instanceof AppError) throw error;
      throw new AppError(`Error fetching ${this.tableName} records`, 500);
    }
  }

  async getByAppointmentId(req: Request, res: Response) {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM ${this.tableName} WHERE AppointmentId = ?`,
        [req.params.appointmentId]
      );
      res.json(rows);
    } catch (error) {
      throw new AppError('Error fetching records', 500);
    }
  }

  async getByStatus(req: Request, res: Response) {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM ${this.tableName} WHERE AppointmentStatusId = ?`,
        [req.params.statusId]
      );
      res.json(rows);
    } catch (error) {
      throw new AppError('Error fetching records by status', 500);
    }
  }

  async getByDateRange(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const [rows] = await pool.query(
        `SELECT * FROM ${this.tableName} WHERE Date BETWEEN ? AND ?`,
        [startDate, endDate]
      );
      res.json(rows);
    } catch (error) {
      throw new AppError('Error fetching records', 500);
    }
  }

  async getCustomerTable(req: Request, res: Response) {
    try {
      const searchTerm = req.query.search as string || '';

      const searchCondition = searchTerm 
        ? `WHERE LOWER(c.Contactpersoon) LIKE LOWER(?) 
           OR LOWER(c.Naam) LIKE LOWER(?) 
           OR LOWER(c.Emailadres) LIKE LOWER(?) 
           OR c.Telefoonnummer LIKE ? 
           OR LOWER(d.Name) LIKE LOWER(?)`
        : '';

      const query = `
        SELECT 
          c.Id,
          c.Contactpersoon,
          c.Naam,
          c.Emailadres,
          c.Telefoonnummer,
          c.IsAllowContactShare,
          COUNT(DISTINCT d.Id) as DogCount,
          GROUP_CONCAT(DISTINCT d.Name) as Dogs,
          DATEDIFF(CURDATE(), MAX(a.Date)) as DaysSinceLastAppointment
        FROM Customer c
        LEFT JOIN Dog d ON c.Id = d.CustomerId
        LEFT JOIN Appointment a ON c.Id = a.CustomerId
        ${searchCondition}
        GROUP BY c.Id, c.Contactpersoon, c.Naam, c.Emailadres, c.Telefoonnummer, c.IsAllowContactShare
        ORDER BY c.Naam
      `;

      const searchParams = searchTerm 
        ? [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
        : [];

      const [rows] = await pool.query(query, searchParams);

      if (!Array.isArray(rows)) {
        console.error('Invalid response from database:', rows);
        throw new AppError('Invalid response from database', 500);
      }

      // Process the results to format the dogs array
      const processedRows = rows.map((row: any) => ({
        ...row,
        Dogs: row.Dogs ? row.Dogs.split(',') : [],
        DaysSinceLastAppointment: row.DaysSinceLastAppointment || null
      }));

      res.json(processedRows);
    } catch (error) {
      console.error('Error in getCustomerTable:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        if ('code' in error) {
          console.error('Error code:', (error as any).code);
        }
        if ('sqlMessage' in error) {
          console.error('SQL Message:', (error as any).sqlMessage);
        }
      }
      throw new AppError('Error fetching customer table data', 500);
    }
  }

  async getDogTable(req: Request, res: Response) {
    try {
      // First check if the Dog table exists and has data
      const [tableCheck] = await pool.query('SELECT COUNT(*) as count FROM Dog');

      if (!Array.isArray(tableCheck) || (tableCheck as any)[0].count === 0) {
        return res.json([]);
      }

      const searchTerm = req.query.search as string || '';
      
      const searchCondition = searchTerm 
        ? `WHERE LOWER(d.Name) LIKE LOWER(?) OR LOWER(c.Contactpersoon) LIKE LOWER(?) OR LOWER(db.Name) LIKE LOWER(?)`
        : '';

      const searchParams = searchTerm 
        ? [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
        : [];

      const query = `
        SELECT 
          d.Id,
          d.Name,
          c.Contactpersoon as CustomerName,
          ds.Label as Size,
          GROUP_CONCAT(DISTINCT db.Name) as Breeds
        FROM Dog d
        LEFT JOIN Customer c ON d.CustomerId = c.Id
        LEFT JOIN Statics_DogSize ds ON d.DogSizeId = ds.Id
        LEFT JOIN DogDogbreed ddb ON d.Id = ddb.DogId
        LEFT JOIN Statics_Dogbreed db ON ddb.DogBreedId = db.Id
        ${searchCondition}
        GROUP BY d.Id, d.Name, c.Contactpersoon, ds.Label
        ORDER BY d.Name
        LIMIT 1000
      `;

      const [rows] = await pool.query(query, searchParams);

      if (!Array.isArray(rows)) {
        console.log('Query did not return an array');
        return res.json([]);
      }

      // Process the results to format the breeds array
      const processedRows = rows.map((row: any) => ({
        ...row,
        Breeds: row.Breeds ? row.Breeds.split(',') : []
      }));

      res.json(processedRows);
    } catch (error) {
      console.error('Error in getDogTable:', error);
      // If there's a table not found error, return empty array
      if (error instanceof Error && 'code' in error && (error as any).code === 'ER_NO_SUCH_TABLE') {
        return res.json([]);
      }
      throw new AppError('Error fetching dog table data', 500);
    }
  }
} 