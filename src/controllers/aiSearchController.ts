import { Request, Response } from 'express';
import OpenAI from 'openai';
import pool from '../config/database';
import { sanitizeSQL } from '../utils/sqlSanitizer';
import fs from 'fs/promises';
import path from 'path';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { tableInfo } from '../utils/tableInfo';

const AI_SETTINGS_PATH = path.join(process.cwd(), 'configuration', 'aiSettings.json');

const getAISettings = async () => {
  try {
    const data = await fs.readFile(AI_SETTINGS_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    throw new Error('Failed to read AI settings');
  }
};

export const handleAISearch = async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Get API key from settings file
    const settings = await getAISettings();
    if (!settings.apiKey) {
      return res.status(400).json({ error: 'OpenAI API key not configured. Please set it in the AI Settings page.' });
    }

    const openai = new OpenAI({
      apiKey: settings.apiKey,
    });

    // Create a detailed prompt with table information
    const tableInfoPrompt = tableInfo.map(table => `
Table: ${table.name}
Description: ${table.description}
Columns:
${table.columns.map(col => `- ${col.name} (${col.type}): ${col.description}`).join('\n')}
`).join('\n\n');

    // Generate SQL query using OpenAI with table information
    const sqlCompletion = await openai.completions.create({
      model: "gpt-3.5-turbo-instruct",
      prompt: `Given these database tables and their structure:

${tableInfoPrompt}

Convert this natural language query into a SAFE SQL query: ${query}

IMPORTANT SAFETY RULES:
1. ONLY use SELECT statements - NO INSERT, UPDATE, DELETE, DROP, ALTER, or other modification commands
2. ONLY use the tables and columns described above
3. Use proper JOIN conditions when querying related tables
4. Use appropriate WHERE clauses for filtering
5. Return ONLY the SQL query, no explanations
6. DO NOT include any comments or explanations in the SQL
7. DO NOT use any DML or DDL commands
8. DO NOT use any database modification keywords
9. DO NOT use any transaction commands
10. DO NOT use any user-defined functions or stored procedures

IMPORTANT CASE SENSITIVITY:
- Table names are PascalCase (e.g., Customer, Dog, Appointment)
- Column names are PascalCase (e.g., Id, Name, Date)
- All identifiers must match the exact case shown in the table structure above

IMPORTANT DATE FUNCTIONS:
- Use WEEK() for week numbers
- Use YEARWEEK() for year-week combinations
- Use DATE_FORMAT() for date formatting
- Use WEEKDAY() for day of week (0 = Monday, 6 = Sunday)
- Use YEAR() for year
- Use MONTH() for month
- Use DAY() for day

Example safe queries with correct casing and MySQL date functions:
- SELECT c.Naam, d.Name FROM Customer c JOIN Dog d ON c.Id = d.CustomerId
- SELECT a.Date, c.Naam FROM Appointment a JOIN Customer c ON a.CustomerId = c.Id
- SELECT COUNT(*) as total_appointments FROM Appointment WHERE YEAR(Date) = YEAR(CURRENT_DATE)
- SELECT sad.Price, a.Date 
  FROM ServiceAppointmentDog sad 
  JOIN AppointmentDog ad ON sad.AppointmentDogId = ad.Id 
  JOIN Appointment a ON ad.AppointmentId = a.Id
- SELECT 
    WEEK(a.Date) as Week,
    SUM(sad.Price) as total_revenue 
  FROM ServiceAppointmentDog sad 
  JOIN AppointmentDog ad ON sad.AppointmentDogId = ad.Id 
  JOIN Appointment a ON ad.AppointmentId = a.Id 
  WHERE YEAR(a.Date) = 2024
  GROUP BY WEEK(a.Date)
  ORDER BY Week
- SELECT 
    DATE_FORMAT(a.Date, '%Y-%m') as Month,
    SUM(sad.Price) as total_revenue 
  FROM ServiceAppointmentDog sad 
  JOIN AppointmentDog ad ON sad.AppointmentDogId = ad.Id 
  JOIN Appointment a ON ad.AppointmentId = a.Id 
  WHERE YEAR(a.Date) = 2024
  GROUP BY DATE_FORMAT(a.Date, '%Y-%m')
  ORDER BY Month

Return only the SQL query, nothing else.`,
      max_tokens: 500,
    });

    const generatedSQL = sqlCompletion.choices[0].text?.trim();
    if (!generatedSQL) {
      throw new Error('Failed to generate SQL query');
    }

    // Sanitize and execute the SQL query
    const sanitizedSQL = sanitizeSQL(generatedSQL);
    const [rows] = await pool.query<RowDataPacket[]>(sanitizedSQL);

    if (!rows || rows.length === 0) {
      return res.json({
        visualization: null,
        textOutput: 'No results found for your query.',
      });
    }

    // Generate visualization prompt
    const visualizationCompletion = await openai.completions.create({
      model: "gpt-3.5-turbo-instruct",
      prompt: `Create a visualization for this data: ${JSON.stringify(rows)}

You have complete creative freedom to design the visualization, but must follow these requirements:

1. Return ONLY valid HTML/CSS/JavaScript code that can be directly injected into a div
2. Use Chart.js for creating charts (load from CDN: https://cdn.jsdelivr.net/npm/chart.js)
3. Ensure the visualization is responsive and mobile-friendly
4. Include proper error handling for script/chart loading
5. Use appropriate chart types and styling for the data
6. Format numbers appropriately (e.g., currency with € symbol)
7. Include clear labels, titles, and legends
8. Use a color scheme that is visually appealing and accessible
9. Add hover effects or tooltips where appropriate
10. Ensure the chart has a minimum height to be visible

You can use any Chart.js features, including:
- Different chart types (line, bar, pie, etc.)
- Animations and transitions
- Custom tooltips and formatters
- Multiple datasets
- Advanced styling options
- Responsive options
- Axis configurations
- Plugin features

Example data structure you'll receive:
{
  "Week": number,
  "Revenue": number
}[]

Return only the complete, working HTML code. No explanations or comments outside the code.`,
      max_tokens: 1500,
    });

    const visualization = visualizationCompletion.choices[0].text?.trim();

    // Generate text summary
    const summaryCompletion = await openai.completions.create({
      model: "gpt-3.5-turbo-instruct",
      prompt: `Provide a clear, concise summary of this data: ${JSON.stringify(rows)}

Important:
1. Focus on the most relevant information
2. Use natural language
3. Highlight any patterns or notable points
4. Keep it brief but informative
5. Return only the summary text, no explanations`,
      max_tokens: 300,
    });

    const textOutput = summaryCompletion.choices[0].text?.trim();

    res.json({
      visualization,
      textOutput,
    });
  } catch (error: any) {
    console.error('AI Search Error:', error);
    
    // Handle specific error types
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.status(400).json({ 
        error: 'Invalid query: The requested table does not exist in the database.' 
      });
    }
    
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(400).json({ 
        error: 'Invalid query: The requested column does not exist in the table. Please check the column names and their case sensitivity.' 
      });
    }

    // Generic error response
    res.status(500).json({ 
      error: 'Failed to process AI search request. Please try a different query or contact support if the issue persists.' 
    });
  }
}; 