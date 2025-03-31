import fs from 'fs';
import path from 'path';

export interface TableInfo {
  name: string;
  description: string;
  columns: TableColumn[];
}

interface ForeignKey {
  column: string;
  references: {
    table: string;
    column: string;
  };
  onDelete?: string;
  onUpdate?: string;
}

interface TableColumn {
  name: string;
  type: string;
  description: string;
  nullable?: boolean;
  defaultValue?: string;
  autoIncrement?: boolean;
}

export interface TableStructure extends TableInfo {
  primaryKey?: string[];
  foreignKeys: ForeignKey[];
  indexes: {
    name: string;
    columns: string[];
    unique: boolean;
  }[];
  staticData?: any[];
}

// Export the StaticDataValue interface for use with formatStaticData
export interface StaticDataValue {
  columns: string[];
  values: any[][];
}

function parseStaticData(sqlContent: string, tableName: string): StaticDataValue | null {
  try {
    // Find INSERT statements for this table
    const insertRegex = new RegExp(`INSERT INTO \`${tableName}\`\\s*\\(([^)]+)\\)\\s*VALUES\\s*((?:\\([^)]+\\)\\s*,?\\s*)+);`, 'g');
    let data: StaticDataValue = {
      columns: [],
      values: []
    };
    
    let match;
    while ((match = insertRegex.exec(sqlContent)) !== null) {
      // Parse column names
      if (!data.columns.length) {
        data.columns = match[1].split(',').map(col => 
          col.trim().replace(/`/g, '')
        );
      }
      
      // Parse values
      const valuesStr = match[2];
      const valueRegex = /\(((?:[^)(]+|\([^)(]*\))*)\)/g;
      let valueMatch;
      
      while ((valueMatch = valueRegex.exec(valuesStr)) !== null) {
        const values = valueMatch[1].split(',').map(val => {
          val = val.trim();
          // Handle NULL values
          if (val.toLowerCase() === 'null') return null;
          // Handle string values
          if (val.startsWith("'") || val.startsWith('"')) {
            return val.slice(1, -1);
          }
          // Handle numeric values
          if (!isNaN(Number(val))) {
            return Number(val);
          }
          // Handle boolean values
          if (val.toLowerCase() === 'true') return true;
          if (val.toLowerCase() === 'false') return false;
          // Default to string
          return val;
        });
        data.values.push(values);
      }
    }
    
    return data.values.length > 0 ? data : null;
  } catch (error) {
    console.error(`Error parsing static data for table ${tableName}:`, error);
    return null;
  }
}

function getTableDescription(tableName: string): string {
  const descriptions: { [key: string]: string } = {
    Customer: 'Contains information about customers and their contact details',
    Dog: 'Contains information about dogs, including their owners and characteristics',
    Appointment: 'Contains information about appointments, including scheduling and status',
    AppointmentDog: 'Links appointments with dogs, allowing multiple dogs per appointment',
    AdditionalHour: 'Tracks additional hours worked outside of appointments',
    ServiceAppointmentDog: 'Links services provided to dogs during appointments, including pricing',
    TravelTime: 'Records travel time and distance information',
    Statics_Service: 'Reference table for available services and their standard pricing',
    Statics_AppointmentStatus: 'Reference table for appointment status codes and their colors',
    Statics_CustomColor: 'Reference table for UI color codes and their hex values',
    Statics_DogSize: 'Reference table for dog size categories (S, M, L, X)',
    Statics_Dogbreed: 'Reference table for recognized dog breeds',
    Statics_HourType: 'Reference table for types of additional hours',
    Statics_ImportExportType: 'Reference table for import/export operation types',
    // Add descriptions for other tables as needed
  };
  
  return descriptions[tableName] || `Contains ${tableName.toLowerCase()} related information`;
}

// Export formatStaticData for use in other files
export function formatStaticData(data: StaticDataValue | null, tableName: string): string {
  if (!data || !data.values.length) return '';
  
  const lines = [`Available values in ${tableName}:`];
  
  // Format the first few values as examples
  const maxExamples = 5;
  const examples = data.values.slice(0, maxExamples).map(row => {
    const pairs = row.map((val, idx) => `${data.columns[idx]}: ${val}`);
    return `- ${pairs.join(', ')}`;
  });
  
  lines.push(...examples);
  
  if (data.values.length > maxExamples) {
    lines.push(`... and ${data.values.length - maxExamples} more values`);
  }
  
  return lines.join('\n');
}

function getColumnDescription(tableName: string, columnName: string): string {
  // Add specific descriptions for important columns
  const key = `${tableName}.${columnName}`;
  const descriptions: { [key: string]: string } = {
    'Customer.Id': 'Unique identifier for the customer',
    'Customer.Naam': 'Name of the customer',
    'Dog.CustomerId': 'Reference to the customer who owns this dog',
    'Appointment.AppointmentStatusId': 'Current status of the appointment',
    'ServiceAppointmentDog.Price': 'Actual price charged for this service',
    // Add more specific descriptions as needed
  };
  
  return descriptions[key] || `${columnName} field for ${tableName}`;
}

function loadCompleteTableInfo(): TableStructure[] {
  try {
    const sqlPath = path.join(process.cwd(), '01-init.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Parse CREATE TABLE statements
    const tableRegex = /CREATE TABLE.*?`(\w+)`\s*\(([\s\S]*?)\)\s*ENGINE.*?;/g;
    const tables: TableStructure[] = [];
    
    let match;
    while ((match = tableRegex.exec(sqlContent)) !== null) {
      const tableName = match[1];
      const tableContent = match[2];
      
      // Parse columns
      const columnRegex = /`(\w+)`\s+([\w()]+)(\s+NOT NULL)?(\s+DEFAULT\s+([^,]+))?(\s+AUTO_INCREMENT)?/g;
      const columns: TableColumn[] = [];
      let columnMatch;
      
      while ((columnMatch = columnRegex.exec(tableContent)) !== null) {
        columns.push({
          name: columnMatch[1],
          type: columnMatch[2],
          description: getColumnDescription(tableName, columnMatch[1]),
          nullable: !columnMatch[3],
          defaultValue: columnMatch[5],
          autoIncrement: !!columnMatch[6]
        });
      }
      
      // Parse foreign keys
      const foreignKeys: ForeignKey[] = [];
      const fkRegex = /FOREIGN KEY \(`(\w+)`\) REFERENCES `(\w+)` \(`(\w+)`\)(\s+ON DELETE (\w+))?(\s+ON UPDATE (\w+))?/g;
      let fkMatch;
      
      while ((fkMatch = fkRegex.exec(tableContent)) !== null) {
        foreignKeys.push({
          column: fkMatch[1],
          references: {
            table: fkMatch[2],
            column: fkMatch[3]
          },
          onDelete: fkMatch[5],
          onUpdate: fkMatch[7]
        });
      }
      
      // Parse indexes
      const indexes = [];
      const indexRegex = /(UNIQUE\s+)?KEY\s+`(\w+)`\s+\(`([^)]+)`\)/g;
      let indexMatch;
      
      while ((indexMatch = indexRegex.exec(tableContent)) !== null) {
        indexes.push({
          name: indexMatch[2],
          columns: indexMatch[3].split(',').map(col => col.trim().replace(/`/g, '')),
          unique: !!indexMatch[1]
        });
      }
      
      // Parse static data if available
      const staticData = parseStaticData(sqlContent, tableName);
      
      tables.push({
        name: tableName,
        description: getTableDescription(tableName),
        columns,
        foreignKeys,
        indexes,
        staticData: staticData ? staticData.values : undefined
      });
    }
    
    return tables;
  } catch (error) {
    console.error('Failed to load complete table info:', error);
    return staticTableInfo; // Fallback to static table info
  }
}

// Define static table info as fallback
const staticTableInfo: TableStructure[] = [
  {
    name: 'Customer',
    description: 'Contains information about customers',
    columns: [
      { name: 'Id', type: 'int', description: 'Unique identifier for the customer' },
      { name: 'Naam', type: 'varchar(255)', description: 'Name of the customer' },
      { name: 'Contactpersoon', type: 'varchar(255)', description: 'Contact person name' },
      { name: 'Emailadres', type: 'varchar(255)', description: 'Email address' },
      { name: 'Telefoonnummer', type: 'varchar(50)', description: 'Phone number' },
      { name: 'Notities', type: 'text', description: 'Additional notes' },
      { name: 'IsExported', type: 'tinyint(1)', description: 'Whether the customer has been exported' },
      { name: 'IsAllowContactShare', type: 'varchar(10)', description: 'Contact sharing permission' },
      { name: 'CreatedOn', type: 'datetime', description: 'Creation timestamp' },
      { name: 'UpdatedOn', type: 'datetime', description: 'Last update timestamp' }
    ],
    foreignKeys: [],
    indexes: []
  },
  // ... other static table definitions ...
];

// Export both the dynamic and static table info
export const completeTableInfo: TableStructure[] = loadCompleteTableInfo();
export const tableInfo: TableInfo[] = staticTableInfo; 