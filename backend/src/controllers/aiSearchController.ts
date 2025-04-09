import { Request, Response } from 'express';
import OpenAI from 'openai';
import pool from '../config/database';
import { sanitizeSQL } from '../utils/sqlSanitizer';
import fs from 'fs/promises';
import path from 'path';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { completeTableInfo } from '../utils/tableInfo';
import { calculateCost, formatCost } from '../utils/openaiCosts';

const AI_SETTINGS_PATH = path.join(process.cwd(), '..', 'configuration', 'aiSettings.json');

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
  costs: {
    total: string;
    breakdown: {
      sqlGeneration: string;
      visualization: string;
      summary: string;
    };
  };
}

// Update the tableInfoPrompt generation
const generateTableInfoPrompt = () => {
  return completeTableInfo.map(table => `
Table: ${table.name}
Description: ${table.description}
Columns:
${table.columns.map(col => {
  const constraints = [];
  if (!col.nullable) constraints.push('NOT NULL');
  if (col.defaultValue) constraints.push(`DEFAULT ${col.defaultValue}`);
  if (col.autoIncrement) constraints.push('AUTO_INCREMENT');
  return `- ${col.name} (${col.type}${constraints.length ? ' ' + constraints.join(' ') : ''}): ${col.description}`;
}).join('\n')}

${table.foreignKeys?.length ? `Foreign Keys:
${table.foreignKeys.map(fk => 
  `- ${fk.column} -> ${fk.references.table}.${fk.references.column}${fk.onDelete ? ` ON DELETE ${fk.onDelete}` : ''}${fk.onUpdate ? ` ON UPDATE ${fk.onUpdate}` : ''}`
).join('\n')}` : ''}

${table.indexes?.length ? `Indexes:
${table.indexes.map(idx => 
  `- ${idx.unique ? 'UNIQUE ' : ''}${idx.name}: (${idx.columns.join(', ')})`
).join('\n')}` : ''}

${table.staticData ? `Contains ${table.staticData.length} predefined values` : ''}
`).join('\n\n');
};

export const handleAISearch = async (req: Request, res: Response) => {
  const steps: string[] = [];
  let totalCost = 0;
  const costs = {
    sqlGeneration: 0,
    visualization: 0,
    summary: 0
  };
  
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

    // Use the enhanced table information
    const tableInfoPrompt = generateTableInfoPrompt();

    // Generate initial SQL query with enhanced schema information
    const sqlCompletion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "system",
        content: `You are a SQL expert that converts natural language queries into safe SQL queries. You must follow these rules:
1. ONLY use SELECT statements - NO INSERT, UPDATE, DELETE, DROP, ALTER, or other modification commands
2. ONLY use the tables and columns from the provided schema
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
13. Use LIMIT instead of TOP for limiting results (MariaDB syntax)

IMPORTANT CASE SENSITIVITY:
- Table names are PascalCase (e.g., Customer, Dog, Appointment)
- Column names are PascalCase (e.g., Id, Name, Date)
- All identifiers must match the exact case shown in the table structure
- Aliases are case-sensitive and must be used exactly as defined in the SELECT clause

IMPORTANT DATE FUNCTIONS:
- Use WEEK() for week numbers
- Use YEARWEEK() for year-week combinations
- Use DATE_FORMAT() for date formatting
- Use WEEKDAY() for day of week (0 = Monday, 6 = Sunday)
- Use YEAR() for year
- Use MONTH() for month
- Use DAY() for day`
      }, {
        role: "user",
        content: `Given this comprehensive database schema:

${tableInfoPrompt}

Convert this natural language query into a SAFE SQL query: ${query}`
      }],
      temperature: 0.3, // Lower temperature for more conservative output
      max_tokens: 1000
    });

    const generatedSQL = sqlCompletion.choices[0].message.content?.trim();

    if (!generatedSQL) {
      throw new Error('Failed to generate SQL query');
    }

    // Use generatedSQL instead of sqlCompletion.choices[0].text
    steps.push('Generated SQL query: ' + generatedSQL);

    // Validate the SQL for safety
    const sanitizedSQL = sanitizeSQL(generatedSQL);
    if (!sanitizedSQL) {
      throw new Error('Generated SQL query contains unsafe operations');
    }

    // Calculate SQL generation cost
    if (sqlCompletion.usage) {
      costs.sqlGeneration = calculateCost('gpt-4', sqlCompletion.usage);
      totalCost += costs.sqlGeneration;
      steps.push(`SQL generation cost: ${formatCost(costs.sqlGeneration)}`);
    }

    steps.push('Executing SQL query...');
    
    // Try the original query first
    try {
      const [rows] = await pool.query<RowDataPacket[]>(sanitizedSQL);

      if (!rows || rows.length === 0) {
        steps.push('Query executed successfully but returned no results');
        return res.json({
          visualization: null,
          textOutput: 'No results found for your query.',
          steps,
          originalQuery: generatedSQL,
          costs: {
            total: formatCost(totalCost),
            breakdown: {
              sqlGeneration: formatCost(costs.sqlGeneration),
              visualization: formatCost(costs.visualization),
              summary: formatCost(costs.summary)
            }
          }
        } as AISearchResponse);
      }

      steps.push(`Query returned ${rows.length} results`);
      steps.push('Generating visualization...');

      // Generate visualization prompt
      const visualizationCompletion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{
          role: "system",
          content: "You are an expert in creating ECharts visualizations. You must ONLY return the configuration code, nothing else - no explanations, no descriptions."
        }, {
          role: "user",
          content: `Create an ECharts visualization for this data: ${JSON.stringify(rows)}

CRITICAL: Return ONLY the configuration code, no explanations or descriptions.

Required format:
const options = {
  title: { text: string },
  tooltip: { ... },
  xAxis: { ... },
  yAxis: { ... },
  series: [{ ... }]
};

Rules:
1. Use appropriate chart type (bar/line/pie/scatter)
2. Include title, tooltip, and proper axes
3. Format currency with € symbol
4. Make it visually appealing
5. DO NOT include any text before or after the configuration
6. DO NOT explain what the configuration does`
        }],
        temperature: 0.3,
      });

      const visualization = visualizationCompletion.choices[0].message.content?.trim() ?? null;
      
      // Validate the visualization output
      let finalVisualization: string | null = visualization;
      if (!visualization || !visualization.startsWith('const options = {')) {
        console.error('Invalid visualization format:', visualization);
        steps.push('Generated visualization was invalid, attempting to regenerate...');
        
        // Try one more time with a simpler chart
        const retryCompletion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [{
            role: "system",
            content: "You are an expert in creating ECharts visualizations. Return ONLY the configuration code, nothing else."
          }, {
            role: "user",
            content: `Create a simple bar chart for this data: ${JSON.stringify(rows)}

CRITICAL: Return ONLY this format, no explanations:
const options = {
  title: { text: 'Chart Title' },
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: [...] },
  yAxis: { type: 'value' },
  series: [{ type: 'bar', data: [...] }]
};`
          }],
          temperature: 0.1,
        });
        
        const retryVisualization = retryCompletion.choices[0].message.content?.trim() ?? null;
        if (retryVisualization?.startsWith('const options = {')) {
          steps.push('Successfully generated a simplified visualization');
          finalVisualization = retryVisualization;
        } else {
          steps.push('Failed to generate a valid visualization');
          finalVisualization = null;
        }
      }

      // Calculate visualization cost
      if (visualizationCompletion.usage) {
        costs.visualization = calculateCost('gpt-4', visualizationCompletion.usage);
        totalCost += costs.visualization;
        steps.push(`Visualization generation cost: ${formatCost(costs.visualization)}`);
      }

      steps.push('Generating summary...');

      // Generate text summary using GPT-4
      const summaryCompletion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{
          role: "system",
          content: "Create clear, concise summaries in markdown format."
        }, {
          role: "user",
          content: `Summarize this data: ${JSON.stringify(rows)}

Use markdown with:
- Headers (##)
- Bold (**text**)
- Code blocks (\`value\`)
- Lists
- Tables if needed

Focus on key insights and metrics.`
        }],
        temperature: 0.7,
      });

      const textOutput = summaryCompletion.choices[0].message.content?.trim() ?? null;
      
      // Calculate summary cost
      if (summaryCompletion.usage) {
        costs.summary = calculateCost('gpt-4', summaryCompletion.usage);
        totalCost += costs.summary;
        steps.push(`Summary generation cost: ${formatCost(costs.summary)}`);
      }

      steps.push('Summary generated successfully');

      steps.push(`Total API cost for this query: ${formatCost(totalCost)}`);

      res.json({
        visualization: finalVisualization,
        textOutput,
        steps,
        originalQuery: generatedSQL,
        costs: {
          total: formatCost(totalCost),
          breakdown: {
            sqlGeneration: formatCost(costs.sqlGeneration),
            visualization: formatCost(costs.visualization),
            summary: formatCost(costs.summary)
          }
        }
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
            fixedQuery: fixedSQL,
            costs: {
              total: formatCost(totalCost),
              breakdown: {
                sqlGeneration: formatCost(costs.sqlGeneration),
                visualization: formatCost(costs.visualization),
                summary: formatCost(costs.summary)
              }
            }
          } as AISearchResponse);
        }

        steps.push(`Fixed query returned ${rows.length} results`);
        steps.push('Generating visualization...');

        // Generate visualization prompt
        const visualizationCompletion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [{
            role: "system",
            content: "You are an expert in creating ECharts visualizations. You must ONLY return the configuration code, nothing else - no explanations, no descriptions."
          }, {
            role: "user",
            content: `Create an ECharts visualization for this data: ${JSON.stringify(rows)}

CRITICAL: Return ONLY the configuration code, no explanations or descriptions.

Required format:
const options = {
  title: { text: string },
  tooltip: { ... },
  xAxis: { ... },
  yAxis: { ... },
  series: [{ ... }]
};

Rules:
1. Use appropriate chart type (bar/line/pie/scatter)
2. Include title, tooltip, and proper axes
3. Format currency with € symbol
4. Make it visually appealing
5. DO NOT include any text before or after the configuration
6. DO NOT explain what the configuration does`
          }],
          temperature: 0.3,
        });

        const visualization = visualizationCompletion.choices[0].message.content?.trim() ?? null;
        
        // Validate the visualization output
        let finalVisualization: string | null = visualization;
        if (!visualization || !visualization.startsWith('const options = {')) {
          console.error('Invalid visualization format:', visualization);
          steps.push('Generated visualization was invalid, attempting to regenerate...');
          
          // Try one more time with a simpler chart
          const retryCompletion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{
              role: "system",
              content: "You are an expert in creating ECharts visualizations. Return ONLY the configuration code, nothing else."
            }, {
              role: "user",
              content: `Create a simple bar chart for this data: ${JSON.stringify(rows)}

CRITICAL: Return ONLY this format, no explanations:
const options = {
  title: { text: 'Chart Title' },
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: [...] },
  yAxis: { type: 'value' },
  series: [{ type: 'bar', data: [...] }]
};`
            }],
            temperature: 0.1,
          });
          
          const retryVisualization = retryCompletion.choices[0].message.content?.trim() ?? null;
          if (retryVisualization?.startsWith('const options = {')) {
            steps.push('Successfully generated a simplified visualization');
            finalVisualization = retryVisualization;
          } else {
            steps.push('Failed to generate a valid visualization');
            finalVisualization = null;
          }
        }

        // Calculate visualization cost
        if (visualizationCompletion.usage) {
          costs.visualization = calculateCost('gpt-4', visualizationCompletion.usage);
          totalCost += costs.visualization;
          steps.push(`Visualization generation cost: ${formatCost(costs.visualization)}`);
        }

        steps.push('Generating summary...');

        // Generate text summary using GPT-4
        const summaryCompletion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [{
            role: "system",
            content: "Create clear, concise summaries in markdown format."
          }, {
            role: "user",
            content: `Summarize this data: ${JSON.stringify(rows)}

Use markdown with:
- Headers (##)
- Bold (**text**)
- Code blocks (\`value\`)
- Lists
- Tables if needed

Focus on key insights and metrics.`
          }],
          temperature: 0.7,
        });

        const textOutput = summaryCompletion.choices[0].message.content?.trim() ?? null;
        
        // Calculate summary cost
        if (summaryCompletion.usage) {
          costs.summary = calculateCost('gpt-4', summaryCompletion.usage);
          totalCost += costs.summary;
          steps.push(`Summary generation cost: ${formatCost(costs.summary)}`);
        }

        steps.push('Summary generated successfully');

        steps.push(`Total API cost for this query: ${formatCost(totalCost)}`);

        res.json({
          visualization: finalVisualization,
          textOutput,
          steps,
          originalQuery: generatedSQL,
          fixedQuery: fixedSQL,
          costs: {
            total: formatCost(totalCost),
            breakdown: {
              sqlGeneration: formatCost(costs.sqlGeneration),
              visualization: formatCost(costs.visualization),
              summary: formatCost(costs.summary)
            }
          }
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
              fixedQuery: finalFixSQL,
              costs: {
                total: formatCost(totalCost),
                breakdown: {
                  sqlGeneration: formatCost(costs.sqlGeneration),
                  visualization: formatCost(costs.visualization),
                  summary: formatCost(costs.summary)
                }
              }
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
    
    // Handle token limit errors specifically
    if (error?.error?.message?.includes('maximum context length')) {
      const errorMessage = 'The query is too complex for the current AI model. This can happen when searching across many tables or with complex conditions. Please try:\n' +
        '1. Breaking down your question into smaller parts\n' +
        '2. Being more specific about which information you need\n' +
        '3. Limiting the number of tables/fields in your query';
      
      return res.status(400).json({ 
        error: errorMessage,
        details: 'Token limit exceeded',
        steps 
      });
    }

    // Handle SQL-specific errors
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.status(400).json({
        error: 'One or more tables referenced in the query do not exist',
        details: error.message,
        steps
      });
    }

    if (error.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(400).json({
        error: 'One or more columns referenced in the query do not exist',
        details: error.message,
        steps
      });
    }

    // Handle other errors
    return res.status(400).json({ 
      error: error.message || 'An error occurred while processing your request',
      steps
    });
  }
}; 