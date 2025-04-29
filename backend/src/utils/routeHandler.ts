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
        return res.status(404).json({ message: 'Record not found' });
      }
      
      // If this is a customer, fetch their dogs as well
      if (this.tableName === 'Customer') {
        const [dogs] = await pool.query(
          'SELECT * FROM Dog WHERE CustomerId = ?',
          [req.params.id]
        );
        
        if (Array.isArray(dogs)) {
          // Add the dogs to the customer object
          (rows[0] as any).Dogs = dogs;
        }
      }
      
      res.json(rows[0]);
    } catch (error) {
      console.error('Error in getById:', {
        table: this.tableName,
        id: req.params.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        sql: error instanceof Error && 'sql' in error ? (error as any).sql : undefined
      });
      
      if (error instanceof AppError) throw error;
      throw new AppError(`Error fetching record: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
  }

  async create(req: Request, res: Response) {
    try {
      if (this.validationSchema) {
        await this.validationSchema.parseAsync(req.body);
      }

      // Remove Id, CreatedOn, and UpdatedOn from request body if present
      const { Id, CreatedOn, UpdatedOn, ...validData } = req.body;
      
      const fields = Object.keys(validData);
      const values = Object.values(validData);
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

      // Remove Id, CreatedOn, and UpdatedOn from request body if present
      const { Id, CreatedOn, UpdatedOn, ...validData } = req.body;

      const fields = Object.keys(validData)
        .map(field => `${field} = ?`)
        .join(', ');
      const values = [...Object.values(validData), req.params.id];
      
      const [result] = await pool.query(
        `UPDATE ${this.tableName} SET ${fields} WHERE Id = ?`,
        values
      );
      
      if ((result as any).affectedRows === 0) {
        throw new AppError('Record not found', 404);
      }
      
      // Get date fields for this table from configuration
      const dateFields = getDateFields(this.tableName);
      
      // Only add date conversion if there are date fields
      const dateConversion = dateFields.length > 0 ? `, ${convertDateFieldsToUTC(dateFields)}` : '';
      
      const [updatedRecord] = await pool.query(
        `SELECT *${dateConversion} FROM ${this.tableName} WHERE Id = ?`,
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
      
      // Special handling for Appointment table due to foreign key constraints
      if (this.tableName === 'Appointment') {
        const connection = await pool.getConnection();
        
        try {
          await connection.beginTransaction();
          
          // First delete related records in AppointmentDog
          const [appointmentDogs] = await connection.execute(
            `SELECT Id FROM AppointmentDog WHERE AppointmentId = ?`,
            [id]
          );
          
          // Delete services for each appointment dog
          for (const dog of (appointmentDogs as any[])) {
            await connection.execute(
              `DELETE FROM ServiceAppointmentDog WHERE AppointmentDogId = ?`,
              [dog.Id]
            );
          }
          
          // Delete all appointment dogs
          await connection.execute(
            `DELETE FROM AppointmentDog WHERE AppointmentId = ?`,
            [id]
          );
          
          // Then delete the appointment
          await connection.execute(
            `DELETE FROM Appointment WHERE Id = ?`,
            [id]
          );
          
          await connection.commit();
          res.json({ message: `${this.tableName} deleted successfully` });
        } catch (error) {
          await connection.rollback();
          console.error(`Error deleting ${this.tableName}:`, error);
          throw new AppError(`Error deleting ${this.tableName}`, 500);
        } finally {
          connection.release();
        }
      } else {
        // Standard delete for other tables
        await pool.query(`DELETE FROM ${this.tableName} WHERE Id = ?`, [id]);
        res.json({ message: `${this.tableName} deleted successfully` });
      }
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
        ? `WHERE LOWER(c.Contactperson) LIKE LOWER(?)
           OR LOWER(c.Name) LIKE LOWER(?)
           OR LOWER(c.Email) LIKE LOWER(?)
           OR c.Phone LIKE ?
           OR LOWER(d.Name) LIKE LOWER(?)`
        : '';

      const query = `
        SELECT 
          c.Id,
          c.Contactperson,
          c.Name,
          c.Email,
          c.Phone,
          c.IsAllowContactShare,
          COUNT(DISTINCT d.Id) as DogCount,
          GROUP_CONCAT(DISTINCT d.Name) as Dogs,
          DATEDIFF(CURDATE(), MAX(a.Date)) as DaysSinceLastAppointment,
          AVG(interval_data.DaysBetween) as AverageInterval
        FROM Customer c
        LEFT JOIN Dog d ON c.Id = d.CustomerId
        LEFT JOIN Appointment a ON c.Id = a.CustomerId
        LEFT JOIN (
          SELECT 
            a1.CustomerId,
            DATEDIFF(a1.Date, a2.Date) as DaysBetween
          FROM 
            Appointment a1
          JOIN 
            Appointment a2 ON a1.CustomerId = a2.CustomerId AND a1.Date > a2.Date
          WHERE 
            NOT EXISTS (
              SELECT 1 FROM Appointment a3
              WHERE a3.CustomerId = a1.CustomerId AND a3.Date > a2.Date AND a3.Date < a1.Date
            )
        ) interval_data ON c.Id = interval_data.CustomerId
        ${searchCondition}
        GROUP BY c.Id, c.Contactperson, c.Name, c.Email, c.Phone, c.IsAllowContactShare
        ORDER BY c.Name
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
        DaysSinceLastAppointment: row.DaysSinceLastAppointment || null,
        AverageInterval: row.AverageInterval ? Math.round(row.AverageInterval) : null
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
      const searchTerm = req.query.search as string;
      
      let query = `
        SELECT 
          d.Id,
          d.Name,
          d.Birthday,
          c.Contactperson as CustomerName,
          ds.Label as Size,
          GROUP_CONCAT(DISTINCT db.Name) as BreedNames,
          GROUP_CONCAT(DISTINCT db.Id) as BreedIds
        FROM Dog d
        LEFT JOIN Customer c ON d.CustomerId = c.Id
        LEFT JOIN Statics_DogSize ds ON d.DogSizeId = ds.Id
        LEFT JOIN DogDogbreed ddb ON d.Id = ddb.DogId
        LEFT JOIN Statics_Dogbreed db ON ddb.DogBreedId = db.Id
      `;

      const params: any[] = [];
      
      if (searchTerm) {
        query += `
          WHERE d.Name LIKE ? 
          OR c.Contactperson LIKE ? 
          OR db.Name LIKE ?
        `;
        params.push(
          `%${searchTerm}%`,
          `%${searchTerm}%`,
          `%${searchTerm}%`
        );
      }
      
      query += ' GROUP BY d.Id';
      
      const [rows] = await pool.query(query, params);
      
      if (!Array.isArray(rows)) {
        throw new AppError('Invalid response from database', 500);
      }

      // Process the results to format the breeds array with both id and name
      const processedRows = rows.map((row: any) => {
        const breedNames = row.BreedNames ? row.BreedNames.split(',') : [];
        const breedIds = row.BreedIds ? row.BreedIds.split(',') : [];
        
        // Create an array of breed objects with Id and Name
        const breeds = breedNames.map((name: string, index: number) => ({
          Id: breedIds[index] || '',
          Name: name
        }));
        
        // Format the birthday if it exists
        if (row.Birthday) {
          row.Birthday = new Date(row.Birthday).toISOString().split('T')[0];
        }
        
        return {
          ...row,
          Breeds: breeds,
          // Remove the temporary fields used for processing
          BreedNames: undefined,
          BreedIds: undefined
        };
      });

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