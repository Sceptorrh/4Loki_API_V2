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
      const [rows] = await pool.query(
        `SELECT * FROM ${this.tableName} WHERE CustomerId = ?`,
        [req.params.customerId]
      );
      res.json(rows);
    } catch (error) {
      throw new AppError('Error fetching records', 500);
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
} 