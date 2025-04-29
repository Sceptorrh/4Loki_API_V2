import { Request, Response } from 'express';
import { AppError } from '../middleware/errorHandler';
import pool from '../config/database';

/**
 * Get active customers
 * An active customer is one with 2+ appointments and last appointment within 100 days
 */
export const getActiveCustomers = async (req: Request, res: Response) => {
  try {
    // Calculate the date 100 days ago
    const date100DaysAgo = new Date();
    date100DaysAgo.setDate(date100DaysAgo.getDate() - 100);
    const formattedDate = date100DaysAgo.toISOString().split('T')[0];
    
    const query = `
      SELECT 
        c.Id,
        c.Contactperson,
        c.Name,
        c.Email,
        c.Phone,
        c.IsAllowContactShare,
        COUNT(DISTINCT a.Id) as AppointmentCount,
        MAX(a.Date) as LastAppointmentDate,
        DATEDIFF(CURDATE(), MAX(a.Date)) as DaysSinceLastAppointment,
        COUNT(DISTINCT d.Id) as DogCount,
        GROUP_CONCAT(DISTINCT d.Name) as Dogs
      FROM Customer c
      JOIN Appointment a ON c.Id = a.CustomerId
      LEFT JOIN Dog d ON c.Id = d.CustomerId
      GROUP BY c.Id, c.Contactperson, c.Name, c.Email, c.Phone, c.IsAllowContactShare
      HAVING COUNT(DISTINCT a.Id) >= 2
      AND MAX(a.Date) >= ?
      ORDER BY c.Name
    `;
    
    const [activeCustomers] = await pool.query(query, [formattedDate]);
    
    if (!Array.isArray(activeCustomers)) {
      console.error('Invalid response from database:', activeCustomers);
      throw new AppError('Invalid response from database', 500);
    }
    
    // Process the results to format the dogs array
    const processedCustomers = (activeCustomers as any[]).map(customer => ({
      ...customer,
      Dogs: customer.Dogs ? customer.Dogs.split(',') : [],
      IsActive: true
    }));
    
    res.json(processedCustomers);
  } catch (error) {
    console.error('Error getting active customers:', error);
    throw new AppError('Failed to retrieve active customers', 500);
  }
};

/**
 * Get active customers history
 * Returns the count of active customers for each month over the past year
 */
export const getActiveCustomersHistory = async (req: Request, res: Response) => {
  try {
    // Calculate the date 100 days ago (this will be used in each month's calculation)
    const DAYS_THRESHOLD = 100;

    // Query to get the count of active customers for each month in the past year
    const query = `
      WITH MonthSeries AS (
        -- Generate a series of months for the past year
        SELECT 
          DATE_FORMAT(LAST_DAY(CURRENT_DATE - INTERVAL n MONTH) + INTERVAL 1 DAY, '%Y-%m-01') AS month_start,
          DATE_FORMAT(LAST_DAY(CURRENT_DATE - INTERVAL n MONTH), '%Y-%m-%d') AS month_end
        FROM (
          SELECT 0 AS n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION
          SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION
          SELECT 10 UNION SELECT 11
        ) months
      )
      
      SELECT 
        DATE_FORMAT(ms.month_start, '%Y-%m') AS month,
        COUNT(DISTINCT active.Id) AS activeCustomers
      FROM 
        MonthSeries ms
      LEFT JOIN (
        -- For each month, find customers who had at least 2 appointments
        -- and their last appointment was within 100 days of that month's end
        SELECT 
          c.Id,
          DATE_FORMAT(ms_inner.month_end, '%Y-%m') AS month
        FROM 
          Customer c
        JOIN 
          MonthSeries ms_inner
        JOIN 
          Appointment a ON c.Id = a.CustomerId
        WHERE 
          a.Date <= ms_inner.month_end
        GROUP BY 
          c.Id, ms_inner.month_end
        HAVING 
          COUNT(DISTINCT a.Id) >= 2 
          AND DATEDIFF(ms_inner.month_end, MAX(a.Date)) <= ${DAYS_THRESHOLD}
      ) active ON active.month = DATE_FORMAT(ms.month_start, '%Y-%m')
      
      GROUP BY 
        DATE_FORMAT(ms.month_start, '%Y-%m')
      ORDER BY 
        ms.month_start
    `;
    
    const [history] = await pool.query(query);
    console.log('Active customers history query result:', history);
    
    if (!Array.isArray(history)) {
      console.error('Invalid response from database:', history);
      throw new AppError('Invalid response from database', 500);
    }
    
    // Make sure we have exactly 12 months of data by filling in missing months with zeros
    const now = new Date();
    const result = [];
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      // Find if we have data for this month
      const existingMonth = (history as any[]).find(item => item.month === monthKey);
      
      result.push({
        month: monthKey,
        activeCustomers: existingMonth ? existingMonth.activeCustomers : 0
      });
    }
    
    console.log('Formatted history data being sent to client:', result);
    res.json(result);
  } catch (error) {
    console.error('Error getting active customers history:', error);
    throw new AppError('Failed to retrieve active customers history', 500);
  }
};

export const getCustomerTable = async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string;
    let query = `
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
    `;

    if (search) {
      query += `
        WHERE c.Contactperson LIKE ? 
        OR c.Name LIKE ? 
        OR c.Email LIKE ? 
        OR c.Phone LIKE ?
        OR d.Name LIKE ?
      `;
    }

    query += `
      GROUP BY c.Id, c.Contactperson, c.Name, c.Email, c.Phone, c.IsAllowContactShare
      ORDER BY c.Name
    `;

    const [rows] = await pool.query(
      query,
      search ? [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`] : []
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching customer table:', error);
    res.status(500).json({ error: 'Failed to fetch customer table' });
  }
}; 