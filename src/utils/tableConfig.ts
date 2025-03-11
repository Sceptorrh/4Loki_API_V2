interface TableDateFields {
  [key: string]: string[];
}

export const tableDateFields: TableDateFields = {
  Dog: ['Birthday', 'CreatedOn', 'UpdatedOn'],
  Customer: ['CreatedOn', 'UpdatedOn'],
  Appointment: ['Date', 'CreatedOn', 'UpdatedOn'],
  // Add other tables as needed
};

export const getDateFields = (tableName: string): string[] => {
  return tableDateFields[tableName] || [];
}; 