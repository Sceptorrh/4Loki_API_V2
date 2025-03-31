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

// Function to attempt to fix common SQL errors
const attemptSQLFix = async (openai: OpenAI, originalQuery: string, error: any, tableInfoPrompt: string) => {
  console.log('Attempting to fix SQL query...');
  
  let errorContext = '';
  if (error.message?.includes('dangerous keyword')) {
    errorContext = 'Remove any dangerous keywords (CREATE, DROP, DELETE, INSERT, UPDATE, ALTER, etc). Use only SELECT statements.';
  } else if (error.code === 'ER_BAD_FIELD_ERROR') {
    errorContext = 'Fix the column names and aliases. Make sure ORDER BY uses the exact alias from SELECT.';
  } else if (error.code === 'ER_NO_SUCH_TABLE') {
    errorContext = 'Fix the table names. Make sure to use exact table names from the schema.';
  } else {
    errorContext = 'Fix any syntax errors and ensure proper column/table names are used.';
  }

  const fixCompletion = await openai.completions.create({
    model: "gpt-3.5-turbo-instruct",
    prompt: `The following SQL query failed with error: ${error.message || error.sqlMessage}

Original query:
${originalQuery}

Fix the query based on these tables and their structure:
${tableInfoPrompt}

IMPORTANT: ${errorContext}

CRITICAL SAFETY RULES:
1. ONLY use SELECT statements
2. DO NOT use any of these dangerous keywords:
   - CREATE
   - DROP
   - DELETE
   - INSERT
   - UPDATE
   - ALTER
   - TRUNCATE
   - MODIFY
3. Keep the same intent as the original query
4. Fix any case sensitivity issues
5. Use proper aliases in ORDER BY/GROUP BY
6. Only use columns and tables that exist

Return only the fixed SQL query, nothing else.`,
    max_tokens: 500,
    temperature: 0.3, // Lower temperature for more conservative output
  });

  return fixCompletion.choices[0].text?.trim();
};

interface AISearchResponse {
  visualization: string | null;
  textOutput: string | null;
  steps: string[];
  originalQuery?: string;
  fixedQuery?: string;
}

export const handleAISearch = async (req: Request, res: Response) => {
  const steps: string[] = [];
  
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    steps.push('Received search query: ' + query);

    // Get API key from settings file
    const settings = await getAISettings();
    if (!settings.apiKey) {
      return res.status(400).json({ error: 'OpenAI API key not configured. Please set it in the AI Settings page.' });
    }

    const openai = new OpenAI({
      apiKey: settings.apiKey,
    });

    steps.push('Generating SQL query from natural language input...');

    // Create a detailed prompt with table information
    const tableInfoPrompt = tableInfo.map(table => `
Table: ${table.name}
Description: ${table.description}
Columns:
${table.columns.map(col => `- ${col.name} (${col.type}): ${col.description}`).join('\n')}
`).join('\n\n');

    // Generate initial SQL query
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
11. When using ORDER BY with aliases, use the exact alias name from the SELECT clause
12. When using GROUP BY, use the actual column names, not aliases

IMPORTANT CASE SENSITIVITY:
- Table names are PascalCase (e.g., Customer, Dog, Appointment)
- Column names are PascalCase (e.g., Id, Name, Date)
- All identifiers must match the exact case shown in the table structure above
- Aliases are case-sensitive and must be used exactly as defined in the SELECT clause

IMPORTANT DATE FUNCTIONS:
- Use WEEK() for week numbers
- Use YEARWEEK() for year-week combinations
- Use DATE_FORMAT() for date formatting
- Use WEEKDAY() for day of week (0 = Monday, 6 = Sunday)
- Use YEAR() for year
- Use MONTH() for month
- Use DAY() for day

Example safe queries with correct casing and alias usage:
- SELECT c.Naam, d.Name FROM Customer c JOIN Dog d ON c.Id = d.CustomerId
- SELECT a.Date, c.Naam FROM Appointment a JOIN Customer c ON a.CustomerId = c.Id
- SELECT COUNT(*) as TotalCount FROM Appointment WHERE YEAR(Date) = YEAR(CURRENT_DATE)
- SELECT 
    sad.Price as Revenue, 
    a.Date 
  FROM ServiceAppointmentDog sad 
  JOIN AppointmentDog ad ON sad.AppointmentDogId = ad.Id 
  JOIN Appointment a ON ad.AppointmentId = a.Id
  ORDER BY Revenue DESC
- SELECT 
    WEEK(a.Date) as WeekNumber,
    SUM(sad.Price) as TotalRevenue 
  FROM ServiceAppointmentDog sad 
  JOIN AppointmentDog ad ON sad.AppointmentDogId = ad.Id 
  JOIN Appointment a ON ad.AppointmentId = a.Id 
  WHERE YEAR(a.Date) = 2024
  GROUP BY WEEK(a.Date)
  ORDER BY WeekNumber
- SELECT 
    DATE_FORMAT(a.Date, '%Y-%m') as Month,
    SUM(sad.Price) as TotalRevenue 
  FROM ServiceAppointmentDog sad 
  JOIN AppointmentDog ad ON sad.AppointmentDogId = ad.Id 
  JOIN Appointment a ON ad.AppointmentId = a.Id 
  WHERE YEAR(a.Date) = 2024
  GROUP BY DATE_FORMAT(a.Date, '%Y-%m')
  ORDER BY Month

Return only the SQL query, nothing else.`,
      max_tokens: 500,
    });

    let generatedSQL = sqlCompletion.choices[0].text?.trim();
    if (!generatedSQL) {
      throw new Error('Failed to generate SQL query');
    }

    steps.push('Generated SQL query: ' + generatedSQL);

    try {
      steps.push('Executing SQL query...');
      
      // Try the original query first
      try {
        const sanitizedSQL = sanitizeSQL(generatedSQL);
        const [rows] = await pool.query<RowDataPacket[]>(sanitizedSQL);

        if (!rows || rows.length === 0) {
          steps.push('Query executed successfully but returned no results');
          return res.json({
            visualization: null,
            textOutput: 'No results found for your query.',
            steps,
            originalQuery: generatedSQL
          } as AISearchResponse);
        }

        steps.push(`Query returned ${rows.length} results`);
        steps.push('Generating visualization...');

        // Generate visualization prompt
        const visualizationCompletion = await openai.completions.create({
          model: "gpt-3.5-turbo-instruct",
          prompt: `Create a visualization for this data: ${JSON.stringify(rows)}

You have complete creative freedom to design the visualization. You can either:

1. Return an ECharts configuration object (assigned to 'const options = ') with these features:
   - Any chart type (line, bar, pie, scatter, heatmap, etc.)
   - Custom styling and colors
   - Proper axis labels and formatting
   - Tooltips and legends
   - Animations and interactions

2. Return custom HTML/CSS for non-chart visualizations like:
   - Tables with formatting
   - Cards or grids
   - Lists with icons
   - Custom layouts
   - Any other visual representation

Guidelines:
1. Choose the most appropriate visualization type for the data
2. Format numbers appropriately (e.g., currency with € symbol)
3. Use clear labels and titles
4. Make it visually appealing and accessible
5. Add helpful tooltips or hover effects where appropriate

For ECharts examples:
const options = {
  title: { text: 'Chart Title' },
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: [...] },
  yAxis: { type: 'value' },
  series: [{ type: 'line', data: [...] }]
};

For HTML examples:
<div class="grid grid-cols-3 gap-4">
  <div class="p-4 bg-white rounded-lg shadow">
    <h3 class="text-lg font-semibold">Title</h3>
    <p class="text-2xl">€1,234.56</p>
  </div>
</div>

Return ONLY the visualization code, nothing else.`,
          max_tokens: 1500,
        });

        const visualization = visualizationCompletion.choices[0].text?.trim();
        
        if (visualization) {
          steps.push('Visualization generated successfully');
        } else {
          steps.push('No visualization could be generated for this data');
        }

        steps.push('Generating summary...');

        // Generate text summary based on whether visualization was created
        const summaryPrompt = visualization ? 
          `Provide a clear, concise summary of this data in markdown format: ${JSON.stringify(rows)}

Important:
1. Use markdown formatting for better readability:
   - Use ## for section headers
   - Use * or - for bullet points
   - Use **bold** for emphasis
   - Use \`code\` for numbers and metrics
   - Use > for important callouts
   - Use tables for structured data
2. Focus on the most relevant information
3. Use natural language
4. Highlight any patterns or notable points
5. Keep it organized and well-structured
6. Return only the markdown-formatted summary text

Example format:
## Summary
- Found \`X\` records in total
- **Key Metrics:**
  - Metric 1: \`value\`
  - Metric 2: \`value\`

> Notable trend: description

## Details
| Category | Value |
|----------|--------|
| Item 1 | Value 1 |
| Item 2 | Value 2 |

Return only the markdown-formatted text, no explanations.` :
          `Answer this query based on the data in markdown format: ${query}

Data: ${JSON.stringify(rows)}

Important:
1. Use markdown formatting for better readability:
   - Use ## for section headers
   - Use * or - for bullet points
   - Use **bold** for emphasis
   - Use \`code\` for numbers and metrics
   - Use > for important callouts
   - Use tables for structured data
2. Provide a clear, detailed answer
3. Use natural language
4. Include relevant numbers and facts
5. Be specific and accurate
6. Keep it organized and well-structured
7. Return only the markdown-formatted text

Example format:
## Answer
The analysis shows that...

**Key Points:**
- Point 1 with \`metric\`
- Point 2 with \`metric\`

> Important insight or conclusion

## Details
| Category | Value |
|----------|--------|
| Item 1 | Value 1 |
| Item 2 | Value 2 |

Return only the markdown-formatted text, no explanations.`;

        const summaryCompletion = await openai.completions.create({
          model: "gpt-3.5-turbo-instruct",
          prompt: summaryPrompt,
          max_tokens: 1000,
          temperature: 0.7,
        });

        const textOutput = summaryCompletion.choices[0].text?.trim();
        
        steps.push('Summary generated successfully');

        res.json({
          visualization,
          textOutput,
          steps,
          originalQuery: generatedSQL
        } as AISearchResponse);

      } catch (queryError: any) {
        console.error('Initial query failed:', queryError);
        steps.push('Initial query failed: ' + queryError.message);
        steps.push('Attempting to fix the query...');

        // Attempt to fix the query
        const fixedSQL = await attemptSQLFix(openai, generatedSQL, queryError, tableInfoPrompt);
        
        if (!fixedSQL) {
          throw queryError; // If we couldn't fix it, throw the original error
        }

        steps.push('Generated fixed query: ' + fixedSQL);
        steps.push('Executing fixed query...');
        
        try {
          // Try the fixed query
          const sanitizedFixedSQL = sanitizeSQL(fixedSQL);
          const [rows] = await pool.query<RowDataPacket[]>(sanitizedFixedSQL);

          if (!rows || rows.length === 0) {
            steps.push('Fixed query executed successfully but returned no results');
            return res.json({
              visualization: null,
              textOutput: 'No results found for your query.',
              steps,
              originalQuery: generatedSQL,
              fixedQuery: fixedSQL
            } as AISearchResponse);
          }

          steps.push(`Fixed query returned ${rows.length} results`);
          steps.push('Generating visualization...');

          // Generate visualization prompt
          const visualizationCompletion = await openai.completions.create({
            model: "gpt-3.5-turbo-instruct",
            prompt: `Create a visualization for this data: ${JSON.stringify(rows)}

You have complete creative freedom to design the visualization. You can either:

1. Return an ECharts configuration object (assigned to 'const options = ') with these features:
   - Any chart type (line, bar, pie, scatter, heatmap, etc.)
   - Custom styling and colors
   - Proper axis labels and formatting
   - Tooltips and legends
   - Animations and interactions

2. Return custom HTML/CSS for non-chart visualizations like:
   - Tables with formatting
   - Cards or grids
   - Lists with icons
   - Custom layouts
   - Any other visual representation

Guidelines:
1. Choose the most appropriate visualization type for the data
2. Format numbers appropriately (e.g., currency with € symbol)
3. Use clear labels and titles
4. Make it visually appealing and accessible
5. Add helpful tooltips or hover effects where appropriate

For ECharts examples:
const options = {
  title: { text: 'Chart Title' },
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: [...] },
  yAxis: { type: 'value' },
  series: [{ type: 'line', data: [...] }]
};

For HTML examples:
<div class="grid grid-cols-3 gap-4">
  <div class="p-4 bg-white rounded-lg shadow">
    <h3 class="text-lg font-semibold">Title</h3>
    <p class="text-2xl">€1,234.56</p>
  </div>
</div>

Return ONLY the visualization code, nothing else.`,
            max_tokens: 1500,
          });

          const visualization = visualizationCompletion.choices[0].text?.trim();
          
          if (visualization) {
            steps.push('Visualization generated successfully');
          } else {
            steps.push('No visualization could be generated for this data');
          }

          steps.push('Generating summary...');

          // Generate text summary based on whether visualization was created
          const summaryPrompt = visualization ? 
            `Provide a clear, concise summary of this data in markdown format: ${JSON.stringify(rows)}

Important:
1. Use markdown formatting for better readability:
   - Use ## for section headers
   - Use * or - for bullet points
   - Use **bold** for emphasis
   - Use \`code\` for numbers and metrics
   - Use > for important callouts
   - Use tables for structured data
2. Focus on the most relevant information
3. Use natural language
4. Highlight any patterns or notable points
5. Keep it organized and well-structured
6. Return only the markdown-formatted summary text

Example format:
## Summary
- Found \`X\` records in total
- **Key Metrics:**
  - Metric 1: \`value\`
  - Metric 2: \`value\`

> Notable trend: description

## Details
| Category | Value |
|----------|--------|
| Item 1 | Value 1 |
| Item 2 | Value 2 |

Return only the markdown-formatted text, no explanations.` :
            `Answer this query based on the data in markdown format: ${query}

Data: ${JSON.stringify(rows)}

Important:
1. Use markdown formatting for better readability:
   - Use ## for section headers
   - Use * or - for bullet points
   - Use **bold** for emphasis
   - Use \`code\` for numbers and metrics
   - Use > for important callouts
   - Use tables for structured data
2. Provide a clear, detailed answer
3. Use natural language
4. Include relevant numbers and facts
5. Be specific and accurate
6. Keep it organized and well-structured
7. Return only the markdown-formatted text

Example format:
## Answer
The analysis shows that...

**Key Points:**
- Point 1 with \`metric\`
- Point 2 with \`metric\`

> Important insight or conclusion

## Details
| Category | Value |
|----------|--------|
| Item 1 | Value 1 |
| Item 2 | Value 2 |

Return only the markdown-formatted text, no explanations.`;

          const summaryCompletion = await openai.completions.create({
            model: "gpt-3.5-turbo-instruct",
            prompt: summaryPrompt,
            max_tokens: 1000,
            temperature: 0.7,
          });

          const textOutput = summaryCompletion.choices[0].text?.trim();
          
          steps.push('Summary generated successfully');

          res.json({
            visualization,
            textOutput,
            steps,
            originalQuery: generatedSQL,
            fixedQuery: fixedSQL
          } as AISearchResponse);

        } catch (fixedQueryError: any) {
          // If the fixed query also fails with a dangerous keyword, try one more time
          if (fixedQueryError.message?.includes('dangerous keyword')) {
            steps.push('Fixed query still contains dangerous keywords. Attempting one final fix...');
            
            const finalFixSQL = await attemptSQLFix(openai, fixedSQL, fixedQueryError, tableInfoPrompt);
            
            if (!finalFixSQL) {
              throw fixedQueryError;
            }

            steps.push('Generated final fixed query: ' + finalFixSQL);
            steps.push('Executing final fixed query...');
            
            const sanitizedFinalSQL = sanitizeSQL(finalFixSQL);
            const [rows] = await pool.query<RowDataPacket[]>(sanitizedFinalSQL);

            // Continue with normal processing if successful
            if (!rows || rows.length === 0) {
              steps.push('Final query executed successfully but returned no results');
              return res.json({
                visualization: null,
                textOutput: 'No results found for your query.',
                steps,
                originalQuery: generatedSQL,
                fixedQuery: finalFixSQL
              } as AISearchResponse);
            }

            // ... continue with visualization and summary generation ...
          } else {
            throw fixedQueryError; // If it's not a dangerous keyword error, throw it
          }
        }
      }

    } catch (error: any) {
      console.error('AI Search Error:', error);
      steps.push('Error occurred: ' + error.message);
      
      // Handle specific error types
      if (error.code === 'ER_NO_SUCH_TABLE') {
        return res.status(400).json({ 
          error: 'Invalid query: The requested table does not exist in the database.',
          steps
        });
      }
      
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        return res.status(400).json({ 
          error: 'Invalid query: The requested column does not exist in the table. Please check the column names and their case sensitivity.',
          steps
        });
      }

      // Generic error response
      res.status(500).json({ 
        error: 'Failed to process AI search request. Please try a different query or contact support if the issue persists.',
        steps
      });
    }

  } catch (error: any) {
    console.error('AI Search Error:', error);
    steps.push('Error occurred: ' + error.message);
    
    // Handle specific error types
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.status(400).json({ 
        error: 'Invalid query: The requested table does not exist in the database.',
        steps
      });
    }
    
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(400).json({ 
        error: 'Invalid query: The requested column does not exist in the table. Please check the column names and their case sensitivity.',
        steps
      });
    }

    // Generic error response
    res.status(500).json({ 
      error: 'Failed to process AI search request. Please try a different query or contact support if the issue persists.',
      steps
    });
  }
}; 