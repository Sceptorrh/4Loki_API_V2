import { Request, Response } from 'express';
import { AppError } from '../middleware/errorHandler';
import pool from '../config/database';
import { AnyZodObject } from 'zod';

export class RouteHandler {
  constructor(
    private tableName: string,
    private validationSchema?: AnyZodObject
  ) {}

  async getAll(req: Request, res: Response) {
    try {
      const [rows] = await pool.query(`SELECT * FROM ${this.tableName}`);
      res.json(rows);
    } catch (error) {
      throw new AppError('Error fetching records', 500);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM ${this.tableName} WHERE Id = ?`,
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
      
      const [result] = await pool.query(
        `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`,
        values
      );
      
      const [newRecord] = await pool.query(
        `SELECT * FROM ${this.tableName} WHERE Id = ?`,
        [(result as any).insertId]
      );
      
      res.status(201).json(Array.isArray(newRecord) ? newRecord[0] : newRecord);
    } catch (error) {
      if (error instanceof AppError) throw error;
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
      const [result] = await pool.query(
        `DELETE FROM ${this.tableName} WHERE Id = ?`,
        [req.params.id]
      );
      
      if ((result as any).affectedRows === 0) {
        throw new AppError('Record not found', 404);
      }
      
      res.status(204).send();
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error deleting record', 500);
    }
  }

  // Additional methods for specific operations
  async getByCustomerId(req: Request, res: Response) {
    try {
      // First check if the customer exists
      const [customer] = await pool.query(
        'SELECT Id FROM Customer WHERE Id = ?',
        [req.params.id]
      );

      if (!Array.isArray(customer) || customer.length === 0) {
        throw new AppError('Customer not found', 404);
      }

      // Then get the dogs
      const [rows] = await pool.query(
        `SELECT * FROM ${this.tableName} WHERE CustomerId = ?`,
        [req.params.id]
      );

      if (!Array.isArray(rows)) {
        throw new AppError('Invalid response from database', 500);
      }

      res.json(rows);
    } catch (error) {
      console.error(`Error fetching ${this.tableName} for customer ${req.params.id}:`, error);
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
      console.log('Fetching customer table data...');
      const searchTerm = req.query.search as string || '';
      console.log('Search term:', searchTerm);

      const searchCondition = searchTerm 
        ? `WHERE c.Contactpersoon LIKE ? OR c.Naam LIKE ? OR c.Emailadres LIKE ? OR c.Telefoonnummer LIKE ? OR d.Name LIKE ?`
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

      console.log('Executing query:', query);
      const searchParams = searchTerm 
        ? [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
        : [];

      console.log('Search parameters:', searchParams);

      const [rows] = await pool.query(query, searchParams);
      console.log('Query executed successfully');

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

      console.log(`Returning ${processedRows.length} customers`);
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
      console.log('Fetching dog table data...');
      const searchTerm = req.query.search as string || '';
      console.log('Search term:', searchTerm);

      const searchCondition = searchTerm 
        ? `WHERE d.Name LIKE ? OR c.Contactpersoon LIKE ? OR db.Name LIKE ?`
        : '';

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
        LEFT JOIN DogBreed db ON ddb.DogBreedId = db.Id
        ${searchCondition}
        GROUP BY d.Id, d.Name, c.Contactpersoon, ds.Label
        ORDER BY d.Name
      `;

      console.log('Executing query:', query);
      const searchParams = searchTerm 
        ? [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
        : [];

      console.log('Search parameters:', searchParams);

      const [rows] = await pool.query(query, searchParams);
      console.log('Query executed successfully');

      if (!Array.isArray(rows)) {
        console.error('Invalid response from database:', rows);
        throw new AppError('Invalid response from database', 500);
      }

      // Process the results to format the breeds array
      const processedRows = rows.map((row: any) => ({
        ...row,
        Breeds: row.Breeds ? row.Breeds.split(',') : []
      }));

      console.log(`Returning ${processedRows.length} dogs`);
      res.json(processedRows);
    } catch (error) {
      console.error('Error in getDogTable:', error);
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
      throw new AppError('Error fetching dog table data', 500);
    }
  }
} 