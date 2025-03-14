interface TableDateFields {
  [key: string]: string[];
}

export const tableDateFields: TableDateFields = {
  Dog: ['Birthday', 'CreatedOn', 'UpdatedOn'],
  Customer: ['CreatedOn', 'UpdatedOn'],
  Appointment: ['Date', 'DateEnd', 'CreatedOn', 'UpdatedOn'],
  AppointmentDog: ['CreatedOn', 'UpdatedOn'],
  Invoice: ['Factuurdatum', 'Vervaldatum', 'CreatedOn', 'UpdatedOn'],
  AdditionalHour: ['Date', 'DateEnd', 'CreatedOn', 'UpdatedOn'],
  DogDogbreed: ['CreatedOn', 'UpdatedOn'],
  ExportLog: ['IssuedOn', 'ForMonthDate', 'CreatedOn', 'UpdatedOn'],
  ServiceAppointmentDog: ['CreatedOn', 'UpdatedOn'],
  TravelTime: ['CreatedOn', 'UpdatedOn']
};

export const getDateFields = (tableName: string): string[] => {
  return tableDateFields[tableName] || [];
}; 