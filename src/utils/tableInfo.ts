export interface TableInfo {
  name: string;
  description: string;
  columns: {
    name: string;
    type: string;
    description: string;
  }[];
}

export const tableInfo: TableInfo[] = [
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
    ]
  },
  {
    name: 'Dog',
    description: 'Contains information about dogs',
    columns: [
      { name: 'Id', type: 'int', description: 'Unique identifier for the dog' },
      { name: 'CustomerId', type: 'int', description: 'ID of the owner (Customer)' },
      { name: 'Name', type: 'varchar(255)', description: 'Name of the dog' },
      { name: 'Birthday', type: 'date', description: 'Date of birth' },
      { name: 'Allergies', type: 'text', description: 'Allergies information' },
      { name: 'ServiceNote', type: 'text', description: 'Service-related notes' },
      { name: 'DogSizeId', type: 'varchar(50)', description: 'Size category ID' },
      { name: 'CreatedOn', type: 'datetime', description: 'Creation timestamp' },
      { name: 'UpdatedOn', type: 'datetime', description: 'Last update timestamp' }
    ]
  },
  {
    name: 'Appointment',
    description: 'Contains information about appointments',
    columns: [
      { name: 'Id', type: 'int', description: 'Unique identifier for the appointment' },
      { name: 'Date', type: 'date', description: 'Appointment date' },
      { name: 'TimeStart', type: 'time', description: 'Start time' },
      { name: 'TimeEnd', type: 'time', description: 'End time' },
      { name: 'DateEnd', type: 'date', description: 'End date (if multi-day)' },
      { name: 'ActualDuration', type: 'int', description: 'Actual duration in minutes' },
      { name: 'CustomerId', type: 'int', description: 'ID of the customer' },
      { name: 'AppointmentStatusId', type: 'varchar(50)', description: 'Status ID' },
      { name: 'Note', type: 'text', description: 'Additional notes' },
      { name: 'SerialNumber', type: 'int', description: 'Serial number' },
      { name: 'IsPaidInCash', type: 'tinyint(1)', description: 'Whether paid in cash' },
      { name: 'CreatedOn', type: 'datetime', description: 'Creation timestamp' },
      { name: 'UpdatedOn', type: 'datetime', description: 'Last update timestamp' }
    ]
  },
  {
    name: 'AppointmentDog',
    description: 'Links appointments with dogs',
    columns: [
      { name: 'Id', type: 'int', description: 'Unique identifier' },
      { name: 'AppointmentId', type: 'int', description: 'ID of the appointment' },
      { name: 'DogId', type: 'int', description: 'ID of the dog' },
      { name: 'Note', type: 'text', description: 'Additional notes' },
      { name: 'CreatedOn', type: 'datetime', description: 'Creation timestamp' },
      { name: 'UpdatedOn', type: 'datetime', description: 'Last update timestamp' }
    ]
  },
  {
    name: 'AdditionalHour',
    description: 'Contains information about additional hours worked',
    columns: [
      { name: 'Id', type: 'int', description: 'Unique identifier' },
      { name: 'HourTypeId', type: 'varchar(20)', description: 'Type of hour' },
      { name: 'Duration', type: 'int', description: 'Duration in minutes' },
      { name: 'Date', type: 'date', description: 'Date of the additional hours' },
      { name: 'Description', type: 'text', description: 'Description of the work' },
      { name: 'IsExported', type: 'tinyint(1)', description: 'Whether exported' },
      { name: 'CreatedOn', type: 'datetime', description: 'Creation timestamp' },
      { name: 'UpdatedOn', type: 'datetime', description: 'Last update timestamp' }
    ]
  },
  {
    name: 'ServiceAppointmentDog',
    description: 'Links services with appointment dogs',
    columns: [
      { name: 'Id', type: 'int', description: 'Unique identifier' },
      { name: 'ServiceId', type: 'varchar(50)', description: 'ID of the service' },
      { name: 'AppointmentDogId', type: 'int', description: 'ID of the appointment dog' },
      { name: 'Price', type: 'decimal(10,2)', description: 'Price of the service' },
      { name: 'CreatedOn', type: 'datetime', description: 'Creation timestamp' },
      { name: 'UpdatedOn', type: 'datetime', description: 'Last update timestamp' }
    ]
  },
  {
    name: 'TravelTime',
    description: 'Contains information about travel times',
    columns: [
      { name: 'Id', type: 'int', description: 'Unique identifier' },
      { name: 'IsHomeToWork', type: 'tinyint(1)', description: 'Whether travel is from home to work' },
      { name: 'Duration', type: 'int', description: 'Duration in minutes' },
      { name: 'Distance', type: 'int', description: 'Distance in kilometers' },
      { name: 'CreatedOn', type: 'datetime', description: 'Creation timestamp' }
    ]
  }
]; 