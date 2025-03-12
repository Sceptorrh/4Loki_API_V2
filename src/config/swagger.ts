import swaggerJsdoc from 'swagger-jsdoc';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '4Loki API Documentation',
      version: '1.0.0',
      description: 'API documentation for the 4Loki dog grooming business',
    },
    servers: [
      {
        url: '/api/v1',
        description: 'API Server',
      },
    ],
    tags: [
      {
        name: 'Customers',
        description: 'Customer management endpoints'
      },
      {
        name: 'Dogs',
        description: 'Dog management endpoints'
      },
      {
        name: 'Dog Breeds',
        description: 'Dog breed management endpoints'
      },
      {
        name: 'Appointments',
        description: 'Appointment management endpoints'
      },
      {
        name: 'Invoices',
        description: 'Invoice management endpoints'
      },
      {
        name: 'Services',
        description: 'Service management endpoints'
      }
    ],
    components: {
      schemas: {
        AdditionalHour: {
          type: 'object',
          properties: {
            Id: { type: 'integer', description: 'The unique identifier for the additional hour', example: 1 },
            HourTypeId: { type: 'string', maxLength: 20, description: 'The type of additional hour', example: 'OVERTIME' },
            Duration: { type: 'integer', description: 'Duration in minutes', example: 60 },
            Date: { type: 'string', format: 'date', description: 'Start date of the additional hour', example: '2024-03-07' },
            DateEnd: { type: 'string', format: 'date', description: 'End date of the additional hour', example: '2024-03-07' },
            StartTime: { type: 'string', format: 'time', description: 'Start time', example: '09:00:00' },
            EndTime: { type: 'string', format: 'time', description: 'End time', example: '10:00:00' },
            IsShowOnPlanning: { type: 'boolean', description: 'Whether to show on planning', example: true },
            Description: { type: 'string', description: 'Description of the additional hour', example: 'Extra grooming time' },
            IsExported: { type: 'boolean', description: 'Whether the record has been exported', example: false },
            OwnerId: { type: 'integer', description: 'ID of the owner', example: 1 },
            InvoiceId: { type: 'integer', description: 'Associated invoice ID', example: 101 },
            IsSkippedExport: { type: 'boolean', description: 'Whether to skip during export', example: false }
          },
          required: ['OwnerId']
        },
        Appointment: {
          type: 'object',
          properties: {
            Id: { type: 'integer', description: 'The unique identifier for the appointment', example: 1 },
            Date: { type: 'string', format: 'date', description: 'Appointment date', example: '2024-03-07' },
            TimeStart: { type: 'string', format: 'time', description: 'Start time', example: '14:00:00' },
            TimeEnd: { type: 'string', format: 'time', description: 'End time', example: '15:30:00' },
            DateEnd: { type: 'string', format: 'date', description: 'End date', example: '2024-03-07' },
            ActualDuration: { type: 'integer', description: 'Actual duration in minutes', example: 90 },
            CustomerId: { type: 'integer', description: 'Customer ID', example: 42 },
            AppointmentStatusId: { type: 'string', description: 'Status ID', example: 'SCHEDULED' },
            CreatedOn: { type: 'string', format: 'date-time', description: 'Creation timestamp', example: '2024-03-07T10:00:00Z' },
            UpdatedOn: { type: 'string', format: 'date-time', description: 'Last update timestamp', example: '2024-03-07T10:00:00Z' },
            TipAmount: { type: 'number', format: 'decimal', description: 'Tip amount', example: 5.00 },
            AppointmentTypeId: { type: 'integer', description: 'Type of appointment', example: 1 },
            Owner: { type: 'integer', description: 'Owner ID', example: 1 },
            Note: { type: 'string', description: 'Appointment notes', example: 'Regular grooming session' },
            ReasonForCancellation: { type: 'string', description: 'Cancellation reason', example: null }
          },
          required: ['Date', 'CustomerId']
        },
        AppointmentDog: {
          type: 'object',
          properties: {
            Id: {
              type: 'integer',
              description: 'The unique identifier'
            },
            AppointmentId: {
              type: 'integer',
              description: 'Appointment ID'
            },
            DogId: {
              type: 'integer',
              description: 'Dog ID'
            },
            Note: {
              type: 'string',
              description: 'Notes'
            },
            OwnerId: {
              type: 'integer',
              description: 'Owner ID'
            }
          },
          required: ['AppointmentId', 'DogId']
        },
        Customer: {
          type: 'object',
          properties: {
            Id: { type: 'integer', description: 'The unique identifier for the customer', example: 42 },
            Naam: { type: 'string', description: 'Customer name', example: 'John Doe' },
            Contactpersoon: { type: 'string', description: 'Contact person', example: 'John Doe' },
            Emailadres: { type: 'string', format: 'email', description: 'Email address', example: 'john.doe@example.com' },
            Telefoonnummer: { type: 'string', description: 'Phone number', example: '+31612345678' },
            Adres: { type: 'string', description: 'Address', example: 'Hoofdstraat 1' },
            Postcode: { type: 'string', description: 'Postal code', example: '1234 AB' },
            Stad: { type: 'string', description: 'City', example: 'Amsterdam' },
            Land: { type: 'string', description: 'Country', example: 'Netherlands' },
            KvKnummer: { type: 'string', description: 'Chamber of Commerce number', example: '12345678' },
            Btwnummer: { type: 'string', description: 'VAT number', example: 'NL123456789B01' },
            IBAN: { type: 'string', description: 'Bank account number', example: 'NL91ABNA0417164300' },
            Notities: { type: 'string', description: 'Notes', example: 'Preferred appointment time: afternoon' },
            OwnerId: { type: 'integer', description: 'Owner ID', example: 1 },
            CreatedOn: { type: 'string', format: 'date-time', description: 'Creation timestamp', example: '2024-03-07T10:00:00Z' },
            UpdatedOn: { type: 'string', format: 'date-time', description: 'Last update timestamp', example: '2024-03-07T10:00:00Z' },
            IsExported: { type: 'boolean', description: 'Export status', example: false },
            HasChanged: { type: 'boolean', description: 'Change status', example: false },
            IsAllowContactShare: { type: 'string', description: 'Contact sharing permission', example: 'YES' }
          },
          required: ['Naam']
        },
        DigiBTW_Expenses: {
          type: 'object',
          properties: {
            Id: { type: 'integer', description: 'The unique identifier', example: 1 },
            Status: { type: 'string', maxLength: 50, description: 'Status', example: 'PROCESSED' },
            Date: { type: 'string', format: 'date', description: 'Date', example: '2024-03-07' },
            InvoiceNumber: { type: 'string', maxLength: 50, description: 'Invoice number', example: 'EXP-2024-001' },
            PriceIncBTW: { type: 'number', format: 'decimal', description: 'Price including VAT', example: 121.00 },
            PriceExlBTW: { type: 'number', format: 'decimal', description: 'Price excluding VAT', example: 100.00 },
            BTW: { type: 'number', format: 'decimal', description: 'VAT amount', example: 21.00 },
            Relation: { type: 'string', maxLength: 50, description: 'Relation', example: 'Supplier A' },
            Description: { type: 'string', maxLength: 500, description: 'Description', example: 'Monthly supplies' },
            Notes: { type: 'string', maxLength: 500, description: 'Notes', example: 'Regular order' },
            CustomerId: { type: 'integer', description: 'Customer ID', example: 42 },
            CreatedOn: { type: 'string', format: 'date-time', description: 'Creation timestamp', example: '2024-03-07T10:00:00Z' }
          }
        },
        DigiBTW_Invoices: {
          type: 'object',
          properties: {
            Id: { type: 'integer', format: 'int64', description: 'The unique identifier', example: 1 },
            Status: { type: 'string', maxLength: 50, description: 'Status', example: 'PAID' },
            Date: { type: 'string', format: 'date', description: 'Date', example: '2024-03-07' },
            IncBTW: { type: 'number', format: 'decimal', description: 'Amount including VAT', example: 121.00 },
            ExcBTW: { type: 'number', format: 'decimal', description: 'Amount excluding VAT', example: 100.00 },
            BTW: { type: 'number', format: 'decimal', description: 'VAT amount', example: 21.00 },
            CustomerName: { type: 'string', maxLength: 100, description: 'Customer name', example: 'John Doe' },
            CustomerContactName: { type: 'string', maxLength: 100, description: 'Contact name', example: 'John Doe' },
            Email: { type: 'string', maxLength: 100, format: 'email', description: 'Email address', example: 'john.doe@example.com' },
            PhoneNumber: { type: 'string', maxLength: 100, description: 'Phone number', example: '+31612345678' },
            Description: { type: 'string', maxLength: 500, description: 'Description', example: 'Dog grooming services' },
            InvoiceNumber: { type: 'string', maxLength: 50, description: 'Invoice number', example: 'INV-2024-001' },
            Reminders: { type: 'integer', format: 'int8', description: 'Number of reminders', example: 0 },
            Reference: { type: 'string', maxLength: 100, description: 'Reference', example: 'REF-2024-001' },
            CreatedOn: { type: 'string', format: 'date-time', description: 'Creation timestamp', example: '2024-03-07T10:00:00Z' }
          }
        },
        Dog: {
          type: 'object',
          properties: {
            Id: { type: 'integer', description: 'The unique identifier for the dog', example: 1 },
            CustomerId: { type: 'integer', description: 'ID of the owner (customer)', example: 42 },
            Name: { type: 'string', description: 'Dog name', example: 'Max' },
            Birthday: { type: 'string', format: 'date', description: 'Dog birthday', example: '2020-01-15' },
            Allergies: { type: 'string', description: 'Allergies information', example: 'None' },
            ServiceNote: { type: 'string', description: 'Notes about service', example: 'Prefers gentle brushing' },
            OwnerId: { type: 'integer', description: 'Owner ID', example: 1 },
            CreatedOn: { type: 'string', format: 'date-time', description: 'Creation timestamp', example: '2024-03-07T10:00:00Z' },
            UpdatedOn: { type: 'string', format: 'date-time', description: 'Last update timestamp', example: '2024-03-07T10:00:00Z' },
            DogSizeId: { type: 'string', description: 'Size category of the dog', example: 'MEDIUM' }
          },
          required: ['CustomerId', 'Name']
        },
        Dogbreed: {
          type: 'object',
          properties: {
            Id: { type: 'integer', description: 'The unique identifier', example: 1 },
            Name: { type: 'string', description: 'Breed name', example: 'Labrador Retriever' },
            OwnerId: { type: 'integer', description: 'Owner ID', example: 1 }
          },
          required: ['Name']
        },
        DogDogbreed: {
          type: 'object',
          properties: {
            Id: { type: 'integer', description: 'The unique identifier', example: 1 },
            DogId: { type: 'integer', description: 'Dog ID', example: 1 },
            DogBreedId: { type: 'integer', description: 'Breed ID', example: 1 },
            OwnerId: { type: 'integer', description: 'Owner ID', example: 1 }
          },
          required: ['DogId', 'DogBreedId']
        },
        DogPicture: {
          type: 'object',
          properties: {
            Id: { type: 'integer', description: 'The unique identifier', example: 1 },
            DogId: { type: 'integer', description: 'Dog ID', example: 1 },
            AppointmentId: { type: 'integer', description: 'Appointment ID', example: 1 },
            DateTime: { type: 'string', format: 'date-time', description: 'Picture timestamp', example: '2024-03-07T10:00:00Z' },
            OwnerId: { type: 'integer', description: 'Owner ID', example: 1 },
            Picture: { type: 'string', format: 'binary', description: 'Picture data', example: 'base64EncodedImageData' }
          },
          required: ['DogId']
        },
        ExportLog: {
          type: 'object',
          properties: {
            Id: { type: 'integer', description: 'The unique identifier', example: 1 },
            IssuedOn: { type: 'string', format: 'date-time', description: 'Issue timestamp', example: '2024-03-07T10:00:00Z' },
            ForMonthDate: { type: 'string', format: 'date', description: 'Month of export', example: '2024-03-01' },
            OwnerId: { type: 'integer', description: 'Owner ID', example: 1 },
            IsSuccesfull: { type: 'boolean', description: 'Success status', example: true },
            IsDummy: { type: 'boolean', description: 'Dummy export flag', example: false }
          }
        },
        Invoice: {
          type: 'object',
          properties: {
            Id: { type: 'integer', description: 'The unique identifier', example: 1001 },
            AppointmentId: { type: 'integer', description: 'Appointment ID', example: 1 },
            SerialNumber: { type: 'integer', description: 'Serial number', example: 20240001 },
            IsExported: { type: 'boolean', description: 'Export status', example: false },
            PaymentTypeId: { type: 'string', description: 'Payment type', example: 'BANK' },
            Factuurnummer: { type: 'string', description: 'Invoice number', example: 'INV-2024-001' },
            Referentie: { type: 'string', description: 'Reference', example: 'REF-2024-001' },
            Factuurdatum: { type: 'string', format: 'date', description: 'Invoice date', example: '2024-03-07' },
            Vervaldatum: { type: 'string', format: 'date', description: 'Due date', example: '2024-04-06' },
            OwnerId: { type: 'integer', description: 'Owner ID', example: 1 },
            IsIncludeInExport: { type: 'boolean', description: 'Include in export flag', example: true },
            CustomCustomerId: { type: 'integer', description: 'Custom customer ID', example: 42 },
            IsPaid: { type: 'boolean', description: 'Payment status', example: false }
          }
        },
        InvoiceLine: {
          type: 'object',
          properties: {
            Id: { type: 'integer', description: 'The unique identifier', example: 1 },
            InvoiceId: { type: 'integer', description: 'Invoice ID', example: 1001 },
            Omschrijving: { type: 'string', description: 'Description', example: 'Dog grooming service - Medium size' },
            Aantal: { type: 'integer', description: 'Quantity', example: 1 },
            BTWpercentageId: { type: 'integer', description: 'VAT percentage ID', example: 1 },
            Bedragexcl_btw: { type: 'number', format: 'decimal', description: 'Amount excluding VAT', example: 50.00 },
            Categorie: { type: 'string', description: 'Category', example: 'GROOMING' },
            OwnerId: { type: 'integer', description: 'Owner ID', example: 1 },
            InvoiceCategoryId: { type: 'integer', description: 'Invoice category ID', example: 1 }
          },
          required: ['InvoiceId']
        },
        Service: {
          type: 'object',
          properties: {
            Id: { type: 'integer', description: 'The unique identifier', example: 1 },
            Name: { type: 'string', description: 'Service name', example: 'Full Grooming' },
            StandardPrice: { type: 'number', format: 'decimal', description: 'Standard price', example: 50.00 },
            IsPrice0Allowed: { type: 'boolean', description: 'Allow zero price', example: false },
            StandardDuration: { type: 'integer', description: 'Standard duration', example: 60 },
            OwnerId: { type: 'integer', description: 'Owner ID', example: 1 }
          },
          required: ['Name']
        },
        ServiceAppointmentDog: {
          type: 'object',
          properties: {
            Id: { type: 'integer', description: 'The unique identifier', example: 1 },
            AppointmentDogId: { type: 'integer', description: 'Appointment-Dog ID', example: 1 },
            ServiceId: { type: 'integer', description: 'Service ID', example: 1 },
            Price: { type: 'number', format: 'decimal', description: 'Price', example: 50.00 },
            OwnerId: { type: 'integer', description: 'Owner ID', example: 1 }
          },
          required: ['AppointmentDogId', 'ServiceId']
        },
        TravelTime: {
          type: 'object',
          properties: {
            Id: { type: 'integer', description: 'The unique identifier', example: 1 },
            Type: { type: 'string', description: 'Travel type', example: 'BUSINESS' },
            DateTime: { type: 'string', format: 'date-time', description: 'Travel timestamp', example: '2024-03-07T10:00:00Z' },
            Value: { type: 'integer', description: 'Travel time value', example: 30 }
          },
          required: ['Type', 'DateTime', 'Value']
        },
        // Static tables
        Statics_AppointmentStatus: {
          type: 'object',
          properties: {
            Id: { type: 'string', description: 'Status identifier', example: 'SCHEDULED' },
            Label: { type: 'string', description: 'Status label', example: 'Scheduled' },
            Order: { type: 'integer', description: 'Display order', example: 1 },
            Is_Active: { type: 'boolean', description: 'Active status', example: true },
            Color: { type: 'string', description: 'Status color', example: 'Blue' }
          },
          required: ['Id']
        },
        Statics_AppointmentType: {
          type: 'object',
          properties: {
            Id: { type: 'integer', description: 'Type identifier', example: 1 },
            Label: { type: 'string', description: 'Type label', example: 'Regular Appointment' },
            Order: { type: 'integer', description: 'Display order', example: 1 },
            Is_Active: { type: 'boolean', description: 'Active status', example: true },
            LabelDutch: { type: 'string', description: 'Dutch label', example: 'Reguliere Afspraak' }
          }
        },
        Statics_BTWpercentage: {
          type: 'object',
          properties: {
            Id: { type: 'integer', description: 'VAT identifier', example: 1 },
            Label: { type: 'string', description: 'VAT label', example: 'Standard Rate' },
            Amount: { type: 'integer', description: 'VAT percentage', example: 21 }
          }
        },
        Statics_CustomColor: {
          type: 'object',
          properties: {
            Color: { type: 'string', description: 'Color identifier', example: 'BLUE' },
            Order: { type: 'integer', description: 'Display order', example: 1 },
            Hex: { type: 'string', description: 'Hex color code', example: '#0000FF' },
            Legend: { type: 'string', description: 'Color legend', example: 'Regular appointments' }
          },
          required: ['Color']
        },
        Statics_DogSize: {
          type: 'object',
          properties: {
            Id: { type: 'string', description: 'Size identifier', example: 'MEDIUM' },
            Label: { type: 'string', description: 'Size label', example: 'Medium' },
            Order: { type: 'integer', description: 'Display order', example: 2 },
            Is_Active: { type: 'boolean', description: 'Active status', example: true }
          },
          required: ['Id']
        },
        Statics_HourType: {
          type: 'object',
          properties: {
            Id: { type: 'string', description: 'Hour type identifier', example: 'OVERTIME' },
            Label: { type: 'string', description: 'Type label', example: 'Overtime' },
            Order: { type: 'integer', description: 'Display order', example: 1 },
            Is_Active: { type: 'boolean', description: 'Active status', example: true },
            DefaultText: { type: 'string', description: 'Default text', example: 'Additional work hours' },
            IsExport: { type: 'boolean', description: 'Export flag', example: true }
          },
          required: ['Id']
        },
        Statics_ImportExportType: {
          type: 'object',
          properties: {
            Id: { type: 'string', description: 'Type identifier', example: 'EXPORT' },
            Label: { type: 'string', description: 'Type label', example: 'Export Data' }
          },
          required: ['Id']
        },
        Statics_InvoiceCategory: {
          type: 'object',
          properties: {
            Id: { type: 'integer', description: 'Category identifier', example: 1 },
            Label: { type: 'string', description: 'Category label', example: 'Services' },
            Order: { type: 'integer', description: 'Display order', example: 1 },
            Is_Active: { type: 'boolean', description: 'Active status', example: true },
            Knab: { type: 'string', description: 'Knab reference', example: 'SERV' }
          }
        },
        Statics_PaymentType: {
          type: 'object',
          properties: {
            Id: { type: 'string', description: 'Payment type identifier', example: 'BANK' },
            Label: { type: 'string', description: 'Type label', example: 'Bank Transfer' },
            Order: { type: 'integer', description: 'Display order', example: 1 },
            Is_Active: { type: 'boolean', description: 'Active status', example: true },
            LabelDutch: { type: 'string', description: 'Dutch label', example: 'Bankoverschrijving' }
          },
          required: ['Id']
        },
        Statics_TravelTimeType: {
          type: 'object',
          properties: {
            Id: { type: 'integer', description: 'Type identifier', example: 1 },
            Label: { type: 'string', description: 'Type label', example: 'Business Travel' },
            Order: { type: 'integer', description: 'Display order', example: 1 },
            Is_Active: { type: 'boolean', description: 'Active status', example: true }
          }
        },
        DetailedAppointment: {
          type: 'object',
          properties: {
            appointment: {
              type: 'object',
              properties: {
                Id: { type: 'integer', description: 'The unique identifier for the appointment', example: 1 },
                Date: { type: 'string', format: 'date', description: 'Appointment date', example: '2024-03-07' },
                TimeStart: { type: 'string', format: 'time', description: 'Start time', example: '14:00:00' },
                TimeEnd: { type: 'string', format: 'time', description: 'End time', example: '15:30:00' },
                DateEnd: { type: 'string', format: 'date', description: 'End date', example: '2024-03-07' },
                ActualDuration: { type: 'integer', description: 'Actual duration in minutes', example: 90 },
                Status: { type: 'string', description: 'Appointment status in readable format', example: 'Scheduled' },
                TipAmount: { type: 'number', format: 'decimal', description: 'Tip amount', example: 5.00 },
                Note: { type: 'string', description: 'Appointment notes', example: 'Regular grooming session' }
              }
            },
            customer: {
              type: 'object',
              properties: {
                Id: { type: 'integer', description: 'Customer ID', example: 42 },
                Naam: { type: 'string', description: 'Customer name', example: 'John Doe' },
                Emailadres: { type: 'string', format: 'email', description: 'Email address', example: 'john.doe@example.com' },
                Telefoonnummer: { type: 'string', description: 'Phone number', example: '+31612345678' }
              }
            },
            allCustomerDogs: {
              type: 'array',
              description: 'All dogs owned by the customer',
              items: {
                type: 'object',
                properties: {
                  Id: { type: 'integer', description: 'Dog ID', example: 1 },
                  Name: { type: 'string', description: 'Dog name', example: 'Max' },
                  DogSizeId: { type: 'string', description: 'Size category', example: 'MEDIUM' }
                }
              }
            },
            appointmentDogs: {
              type: 'array',
              description: 'Dogs included in this appointment',
              items: {
                type: 'object',
                properties: {
                  Id: { type: 'integer', description: 'Dog ID', example: 1 },
                  Name: { type: 'string', description: 'Dog name', example: 'Max' },
                  DogSizeId: { type: 'string', description: 'Size category', example: 'MEDIUM' },
                  services: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        Id: { type: 'integer', description: 'Service ID', example: 1 },
                        Name: { type: 'string', description: 'Service name', example: 'Full Grooming' },
                        Price: { type: 'number', format: 'decimal', description: 'Service price', example: 50.00 }
                      }
                    }
                  },
                  Note: { type: 'string', description: 'Notes for this dog', example: 'Prefers gentle brushing' }
                }
              }
            }
          }
        },
        DogBreed: {
          type: 'object',
          properties: {
            Id: { 
              type: 'integer', 
              description: 'The unique identifier for the dog breed',
              example: 1
            },
            Name: { 
              type: 'string', 
              description: 'Name of the breed',
              example: 'Golden Retriever'
            },
            OwnerId: {
              type: 'integer',
              description: 'Owner ID',
              example: 1
            }
          },
          required: ['Name']
        }
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{
      bearerAuth: [],
    }],
  },
  apis: [
    './src/routes/*.ts',  // Path to route files
    './src/routes/**/*.ts',  // Include nested route files
    './dist/routes/*.js',  // Include compiled JavaScript files
    './dist/routes/**/*.js'  // Include nested compiled JavaScript files
  ],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions); 