import { Request, Response } from 'express';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

interface FinancialStatsRow extends RowDataPacket {
    period: string;
    total_appointments: number;
    total_revenue: number;
    average_price: number;
}

interface AppointmentStatsRow extends RowDataPacket {
    period: string;
    total_appointments: number;
    unique_dogs: number;
    unique_customers: number;
}

interface ServiceStatsRow extends RowDataPacket {
    service_type: string;
    total_count: number;
    total_revenue: number;
}

export const getFinancialStats = async (req: Request, res: Response) => {
    try {
        const { period, startDate, endDate } = req.query;
        let dateFormat = '';
        switch (period) {
            case 'day':
                dateFormat = '%Y-%m-%d';
                break;
            case 'week':
                dateFormat = '%Y-%u';
                break;
            case 'month':
                dateFormat = '%Y-%m';
                break;
            case 'year':
                dateFormat = '%Y';
                break;
            default:
                dateFormat = '%Y-%m';
        }

        let query = `
            SELECT 
                DATE_FORMAT(a.Date, ?) as period,
                COUNT(DISTINCT a.Id) as total_appointments,
                SUM(sad.Price) as total_revenue,
                AVG(sad.Price) as average_price
            FROM Appointment a
            JOIN AppointmentDog ad ON a.Id = ad.AppointmentId
            JOIN ServiceAppointmentDog sad ON ad.Id = sad.AppointmentDogId
            WHERE a.Date BETWEEN ? AND ?
            GROUP BY DATE_FORMAT(a.Date, ?)
            ORDER BY period DESC
        `;

        const [rows] = await pool.query<FinancialStatsRow[]>(query, [dateFormat, startDate, endDate, dateFormat]);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching financial stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAppointmentStats = async (req: Request, res: Response) => {
    try {
        const { period, startDate, endDate } = req.query;
        let dateFormat = '';
        switch (period) {
            case 'day':
                dateFormat = '%Y-%m-%d';
                break;
            case 'week':
                dateFormat = '%Y-%u';
                break;
            case 'month':
                dateFormat = '%Y-%m';
                break;
            case 'year':
                dateFormat = '%Y';
                break;
            default:
                dateFormat = '%Y-%m';
        }

        let query = `
            SELECT 
                DATE_FORMAT(a.Date, ?) as period,
                COUNT(DISTINCT a.Id) as total_appointments,
                COUNT(DISTINCT ad.DogId) as unique_dogs,
                COUNT(DISTINCT a.CustomerId) as unique_customers
            FROM Appointment a
            JOIN AppointmentDog ad ON a.Id = ad.AppointmentId
            WHERE a.Date BETWEEN ? AND ?
            GROUP BY DATE_FORMAT(a.Date, ?)
            ORDER BY period DESC
        `;

        const [rows] = await pool.query<AppointmentStatsRow[]>(query, [dateFormat, startDate, endDate, dateFormat]);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching appointment stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getServiceTypeStats = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;
        let query = `
            SELECT 
                s.Name as service_type,
                COUNT(DISTINCT sad.Id) as total_count,
                SUM(sad.Price) as total_revenue
            FROM Appointment a
            JOIN AppointmentDog ad ON a.Id = ad.AppointmentId
            JOIN ServiceAppointmentDog sad ON ad.Id = sad.AppointmentDogId
            JOIN Statics_Service s ON sad.ServiceId = s.Id
            WHERE a.Date BETWEEN ? AND ?
            GROUP BY s.Name
            ORDER BY total_count DESC
        `;

        const [rows] = await pool.query<ServiceStatsRow[]>(query, [startDate, endDate]);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching service type stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}; 