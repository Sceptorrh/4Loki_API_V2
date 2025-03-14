import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

// Determine the correct paths based on whether we're running from source or compiled code
const isCompiledCode = __filename.endsWith('.js');
const basePath = isCompiledCode ? path.join(__dirname, '..') : path.join(__dirname, '..');

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
            StartTime: { type: 'string', format: 'time', description: 'Start time', example: '09:00' },
            EndTime: { type: 'string', format: 'time', description: 'End time', example: '10:00' },
            IsShowOnPlanning: { type: 'boolean', description: 'Whether to show on planning', example: true },
            Description: { type: 'string', description: 'Description of the additional hour', example: 'Extra grooming time' },
            IsExported: { type: 'boolean', description: 'Whether the record has been exported', example: false },
            InvoiceId: { type: 'integer', description: 'Associated invoice ID', example: 101 },
            CreatedOn: { type: 'string', format: 'date-time', description: 'Creation timestamp', example: '2024-03-07T10:00:00Z' },
            UpdatedOn: { type: 'string', format: 'date-time', description: 'Last update timestamp', example: '2024-03-07T10:00:00Z' }
          },
          required: []
        },
        Appointment: {
          type: 'object',
          properties: {
            Id: { type: 'integer', description: 'The unique identifier for the appointment', example: 1 },
            Date: { type: 'string', format: 'date', description: 'Appointment date', example: '2024-03-07' },
            TimeStart: { type: 'string', format: 'time', description: 'Start time', example: '14:00' },
            TimeEnd: { type: 'string', format: 'time', description: 'End time', example: '15:30' },
            DateEnd: { type: 'string', format: 'date', description: 'End date', example: '2024-03-07' },
            ActualDuration: { type: 'integer', description: 'Actual duration in minutes', example: 90 },
            CustomerId: { type: 'integer', description: 'Customer ID', example: 42 },
            AppointmentStatusId: { type: 'string', description: 'Status ID', example: 'Pln' },
            AppointmentTypeId: { type: 'string', description: 'Type of appointment', example: 'Grooming' },
            Note: { type: 'string', description: 'Appointment notes', example: 'Regular grooming session' },
            CreatedOn: { type: 'string', format: 'date-time', description: 'Creation timestamp', example: '2024-03-07T10:00:00Z' },
            UpdatedOn: { type: 'string', format: 'date-time', description: 'Last update timestamp', example: '2024-03-07T10:00:00Z' }
          },
          required: ['Date', 'CustomerId', 'AppointmentStatusId', 'AppointmentTypeId']
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
            CreatedOn: { 
              type: 'string', 
              format: 'date-time', 
              description: 'Creation timestamp', 
              example: '2024-03-07T10:00:00Z' 
            },
            UpdatedOn: { 
              type: 'string', 
              format: 'date-time', 
              description: 'Last update timestamp', 
              example: '2024-03-07T10:00:00Z' 
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
            Notities: { type: 'string', description: 'Notes', example: 'Preferred appointment time: afternoon' },
            CreatedOn: { type: 'string', format: 'date-time', description: 'Creation timestamp', example: '2024-03-07T10:00:00Z' },
            UpdatedOn: { type: 'string', format: 'date-time', description: 'Last update timestamp', example: '2024-03-07T10:00:00Z' },
            IsExported: { type: 'boolean', description: 'Export status', example: false },
            IsAllowContactShare: { type: 'string', description: 'Contact sharing permission', example: 'YES' }
          },
          required: ['Naam']
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
            DogSizeId: { type: 'string', description: 'Size category of the dog', example: 'M' },
            CreatedOn: { type: 'string', format: 'date-time', description: 'Creation timestamp', example: '2024-03-07T10:00:00Z' },
            UpdatedOn: { type: 'string', format: 'date-time', description: 'Last update timestamp', example: '2024-03-07T10:00:00Z' },
            DogBreeds: { 
              type: 'array', 
              description: 'List of dog breed IDs', 
              items: { 
                type: 'string',
                description: 'Dog breed ID',
                example: 'labrador'
              }
            }
          },
          required: ['CustomerId', 'Name', 'DogSizeId']
        },
        Dogbreed: {
          type: 'object',
          properties: {
            Id: { type: 'string', description: 'The unique identifier', example: 'labrador' },
            Name: { type: 'string', description: 'Breed name', example: 'Labrador Retriever' },
            Order: { type: 'integer', description: 'Display order', example: 1 }
          },
          required: ['Id', 'Name']
        },
        DogDogbreed: {
          type: 'object',
          properties: {
            Id: { type: 'integer', description: 'The unique identifier', example: 1 },
            DogId: { type: 'integer', description: 'Dog ID', example: 1 },
            DogBreedId: { type: 'string', description: 'Breed ID', example: 'labrador' },
            CreatedOn: { 
              type: 'string', 
              format: 'date-time', 
              description: 'Creation timestamp', 
              example: '2024-03-07T10:00:00Z' 
            },
            UpdatedOn: { 
              type: 'string', 
              format: 'date-time', 
              description: 'Last update timestamp', 
              example: '2024-03-07T10:00:00Z' 
            }
          },
          required: ['DogId', 'DogBreedId']
        },
        ExportLog: {
          type: 'object',
          properties: {
            Id: { type: 'integer', description: 'The unique identifier', example: 1 },
            IssuedOn: { type: 'string', format: 'date-time', description: 'Issue timestamp', example: '2024-03-07T10:00:00Z' },
            ForMonthDate: { type: 'string', format: 'date', description: 'Month of export', example: '2024-03-01' },
            IsSuccesfull: { type: 'boolean', description: 'Success status', example: true },
            IsDummy: { type: 'boolean', description: 'Dummy export flag', example: false },
            CreatedOn: { 
              type: 'string', 
              format: 'date-time', 
              description: 'Creation timestamp', 
              example: '2024-03-07T10:00:00Z' 
            },
            UpdatedOn: { 
              type: 'string', 
              format: 'date-time', 
              description: 'Last update timestamp', 
              example: '2024-03-07T10:00:00Z' 
            }
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
            CustomCustomerId: { type: 'integer', description: 'Custom customer ID', example: 42 },
            CreatedOn: { 
              type: 'string', 
              format: 'date-time', 
              description: 'Creation timestamp', 
              example: '2024-03-07T10:00:00Z' 
            },
            UpdatedOn: { 
              type: 'string', 
              format: 'date-time', 
              description: 'Last update timestamp', 
              example: '2024-03-07T10:00:00Z' 
            },
            IsIncludeInExport: { type: 'boolean', description: 'Include in export flag', example: true },
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
            CreatedOn: { 
              type: 'string', 
              format: 'date-time', 
              description: 'Creation timestamp', 
              example: '2024-03-07T10:00:00Z' 
            },
            UpdatedOn: { 
              type: 'string', 
              format: 'date-time', 
              description: 'Last update timestamp', 
              example: '2024-03-07T10:00:00Z' 
            },
            InvoiceCategoryId: { type: 'integer', description: 'Invoice category ID', example: 1 }
          },
          required: ['InvoiceId']
        },
        Service: {
          type: 'object',
          properties: {
            Id: { type: 'string', description: 'The unique identifier', example: 'trimmen' },
            Name: { type: 'string', description: 'Service name', example: 'Trimmen' },
            StandardPrice: { type: 'number', format: 'decimal', description: 'Standard price', example: 60.00 },
            IsPriceAllowed: { type: 'boolean', description: 'Allow custom price', example: false },
            StandardDuration: { type: 'integer', description: 'Standard duration in minutes', example: 120 },
            Order: { type: 'integer', description: 'Display order', example: 1 }
          },
          required: ['Id', 'Name']
        },
        ServiceAppointmentDog: {
          type: 'object',
          properties: {
            Id: { type: 'integer', description: 'The unique identifier', example: 1 },
            AppointmentDogId: { type: 'integer', description: 'Appointment-Dog ID', example: 1 },
            ServiceId: { type: 'string', description: 'Service ID', example: 'trimmen' },
            Price: { type: 'number', format: 'decimal', description: 'Price', example: 60.00 },
            CreatedOn: { 
              type: 'string', 
              format: 'date-time', 
              description: 'Creation timestamp', 
              example: '2024-03-07T10:00:00Z' 
            },
            UpdatedOn: { 
              type: 'string', 
              format: 'date-time', 
              description: 'Last update timestamp', 
              example: '2024-03-07T10:00:00Z' 
            }
          },
          required: ['AppointmentDogId', 'ServiceId']
        },
        TravelTime: {
          type: 'object',
          properties: {
            Id: { type: 'integer', description: 'The unique identifier', example: 1 },
            AppointmentId: { type: 'integer', description: 'Appointment ID', example: 1 },
            TravelTimeTypeId: { type: 'string', description: 'Travel time type ID', example: 'HomeWork' },
            Duration: { type: 'integer', description: 'Duration in minutes', example: 30 },
            CreatedOn: { 
              type: 'string', 
              format: 'date-time', 
              description: 'Creation timestamp', 
              example: '2024-03-07T10:00:00Z' 
            },
            UpdatedOn: { 
              type: 'string', 
              format: 'date-time', 
              description: 'Last update timestamp', 
              example: '2024-03-07T10:00:00Z' 
            }
          },
          required: ['AppointmentId', 'TravelTimeTypeId', 'Duration']
        },
        // Static tables
        Statics_AppointmentStatus: {
          type: 'object',
          properties: {
            Id: { type: 'string', description: 'Status identifier', example: 'Pln' },
            Label: { type: 'string', description: 'Status label', example: 'Gepland' },
            Order: { type: 'integer', description: 'Display order', example: 2 },
            Color: { type: 'string', description: 'Status color', example: 'Planned' }
          },
          required: ['Id']
        },
        Statics_AppointmentType: {
          type: 'object',
          properties: {
            Id: { type: 'string', description: 'Type identifier', example: 'Grooming' },
            Label: { type: 'string', description: 'Type label', example: 'Grooming' },
            Order: { type: 'integer', description: 'Display order', example: 1 },
            LabelDutch: { type: 'string', description: 'Dutch label', example: 'Trimmen' }
          },
          required: ['Id']
        },
        Statics_BTWpercentage: {
          type: 'object',
          properties: {
            Id: { type: 'string', description: 'VAT identifier', example: '21' },
            Label: { type: 'string', description: 'VAT label', example: '21%' },
            Amount: { type: 'integer', description: 'VAT percentage', example: 21 },
            Order: { type: 'integer', description: 'Display order', example: 1 }
          },
          required: ['Id']
        },
        Statics_CustomColor: {
          type: 'object',
          properties: {
            Color: { type: 'string', description: 'Color identifier', example: 'Planned' },
            Order: { type: 'integer', description: 'Display order', example: 1 },
            Hex: { type: 'string', description: 'Hex color code', example: '#a9abb0' },
            Legend: { type: 'string', description: 'Color legend', example: 'Geplanned' }
          },
          required: ['Color']
        },
        Statics_DogSize: {
          type: 'object',
          properties: {
            Id: { type: 'string', description: 'Size identifier', example: 'M' },
            Label: { type: 'string', description: 'Size label', example: 'Middle' },
            Order: { type: 'integer', description: 'Display order', example: 2 }
          },
          required: ['Id']
        },
        Statics_HourType: {
          type: 'object',
          properties: {
            Id: { type: 'string', description: 'Hour type identifier', example: 'Adm' },
            Label: { type: 'string', description: 'Type label', example: 'Administratie' },
            Order: { type: 'integer', description: 'Display order', example: 1 },
            DefaultText: { type: 'string', description: 'Default text', example: 'Administratie' },
            IsExport: { type: 'boolean', description: 'Export flag', example: true }
          },
          required: ['Id']
        },
        Statics_ImportExportType: {
          type: 'object',
          properties: {
            Id: { type: 'string', description: 'Type identifier', example: 'Hour' },
            Label: { type: 'string', description: 'Type label', example: 'Hour' },
            Order: { type: 'integer', description: 'Display order', example: 1 }
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
            Id: { type: 'string', description: 'Payment type identifier', example: 'BT' },
            Label: { type: 'string', description: 'Type label', example: 'Bank' },
            Order: { type: 'integer', description: 'Display order', example: 3 },
            LabelDutch: { type: 'string', description: 'Dutch label', example: null }
          },
          required: ['Id']
        },
        Statics_TravelTimeType: {
          type: 'object',
          properties: {
            Id: { type: 'string', description: 'Type identifier', example: 'HomeWork' },
            Label: { type: 'string', description: 'Type label', example: 'HomeWork' },
            Order: { type: 'integer', description: 'Display order', example: 1 }
          },
          required: ['Id']
        },
        DetailedAppointment: {
          type: 'object',
          properties: {
            appointment: {
              type: 'object',
              properties: {
                Id: { type: 'integer', description: 'The unique identifier for the appointment', example: 1 },
                Date: { type: 'string', format: 'date', description: 'Appointment date', example: '2024-03-07' },
                TimeStart: { type: 'string', format: 'time', description: 'Start time', example: '14:00' },
                TimeEnd: { type: 'string', format: 'time', description: 'End time', example: '15:30' },
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
                  DogSizeId: { type: 'string', description: 'Size category', example: 'M' }
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
                  DogSizeId: { type: 'string', description: 'Size category', example: 'M' },
                  services: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        Id: { type: 'string', description: 'Service ID', example: 'trimmen' },
                        Name: { type: 'string', description: 'Service name', example: 'Trimmen' },
                        Price: { type: 'number', format: 'decimal', description: 'Service price', example: 60.00 }
                      }
                    }
                  },
                  Note: { type: 'string', description: 'Notes for this dog', example: 'Prefers gentle brushing' }
                }
              }
            }
          }
        },
        CompleteAppointment: {
          type: 'object',
          properties: {
            appointment: {
              $ref: '#/components/schemas/Appointment'
            },
            appointmentDogs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  DogId: {
                    type: 'integer',
                    description: 'Dog ID'
                  },
                  Note: {
                    type: 'string',
                    description: 'Notes for this dog'
                  },
                  services: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        ServiceId: {
                          type: 'string',
                          description: 'Service ID'
                        },
                        Price: {
                          type: 'number',
                          format: 'decimal',
                          description: 'Service price'
                        }
                      },
                      required: ['ServiceId', 'Price']
                    }
                  }
                },
                required: ['DogId', 'services']
              }
            }
          },
          required: ['appointment', 'appointmentDogs']
        },
        // New CompleteAppointmentInput schema for POST/PUT operations
        CompleteAppointmentInput: {
          type: 'object',
          properties: {
            appointment: {
              type: 'object',
              properties: {
                Date: { type: 'string', format: 'date', description: 'Appointment date', example: '2024-03-07' },
                TimeStart: { type: 'string', format: 'time', description: 'Start time', example: '14:00' },
                TimeEnd: { type: 'string', format: 'time', description: 'End time', example: '15:30' },
                DateEnd: { type: 'string', format: 'date', description: 'End date', example: '2024-03-07' },
                ActualDuration: { type: 'integer', description: 'Actual duration in minutes', example: 90 },
                CustomerId: { type: 'integer', description: 'Customer ID', example: 42 },
                AppointmentStatusId: { type: 'string', description: 'Status ID', example: 'Pln' },
                AppointmentTypeId: { type: 'string', description: 'Type of appointment', example: 'Grooming' },
                Note: { type: 'string', description: 'Appointment notes', example: 'Regular grooming session' }
              },
              required: ['Date', 'CustomerId', 'AppointmentStatusId', 'AppointmentTypeId']
            },
            appointmentDogs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  DogId: {
                    type: 'integer',
                    description: 'Dog ID',
                    example: 1
                  },
                  Note: {
                    type: 'string',
                    description: 'Notes for this dog',
                    example: 'Prefers gentle brushing'
                  },
                  services: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        ServiceId: {
                          type: 'string',
                          description: 'Service ID from Statics_Service table',
                          example: 'trimmen'
                        },
                        Price: {
                          type: 'number',
                          format: 'decimal',
                          description: 'Service price',
                          example: 60.00
                        }
                      },
                      required: ['ServiceId', 'Price']
                    }
                  }
                },
                required: ['DogId', 'services']
              }
            }
          },
          required: ['appointment', 'appointmentDogs']
        },
        // Input schemas for POST/PUT operations (without CreatedOn and UpdatedOn)
        AdditionalHourInput: {
          type: 'object',
          properties: {
            HourTypeId: { type: 'string', maxLength: 20, description: 'The type of additional hour', example: 'Adm' },
            Duration: { type: 'integer', description: 'Duration in minutes', example: 60 },
            Date: { type: 'string', format: 'date', description: 'Start date of the additional hour', example: '2024-03-07' },
            DateEnd: { type: 'string', format: 'date', description: 'End date of the additional hour', example: '2024-03-07' },
            StartTime: { type: 'string', format: 'time', description: 'Start time', example: '09:00' },
            EndTime: { type: 'string', format: 'time', description: 'End time', example: '10:00' },
            IsShowOnPlanning: { type: 'boolean', description: 'Whether to show on planning', example: true },
            Description: { type: 'string', description: 'Description of the additional hour', example: 'Extra grooming time' },
            IsExported: { type: 'boolean', description: 'Whether the record has been exported', example: false },
            InvoiceId: { type: 'integer', description: 'Associated invoice ID', example: 101 }
          },
          required: ['HourTypeId', 'Duration', 'Date']
        },
        AppointmentInput: {
          type: 'object',
          properties: {
            Date: { type: 'string', format: 'date', description: 'Appointment date', example: '2024-03-07' },
            TimeStart: { type: 'string', format: 'time', description: 'Start time', example: '14:00' },
            TimeEnd: { type: 'string', format: 'time', description: 'End time', example: '15:30' },
            DateEnd: { type: 'string', format: 'date', description: 'End date', example: '2024-03-07' },
            ActualDuration: { type: 'integer', description: 'Actual duration in minutes', example: 90 },
            CustomerId: { type: 'integer', description: 'Customer ID', example: 42 },
            AppointmentStatusId: { type: 'string', description: 'Status ID', example: 'Pln' },
            AppointmentTypeId: { type: 'string', description: 'Type of appointment', example: 'Grooming' },
            Note: { type: 'string', description: 'Appointment notes', example: 'Regular grooming session' }
          },
          required: ['Date', 'CustomerId', 'AppointmentStatusId', 'AppointmentTypeId']
        },
        AppointmentDogInput: {
          type: 'object',
          properties: {
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
            }
          },
          required: ['AppointmentId', 'DogId']
        },
        CustomerInput: {
          type: 'object',
          properties: {
            Naam: { type: 'string', description: 'Customer name', example: 'John Doe' },
            Contactpersoon: { type: 'string', description: 'Contact person', example: 'John Doe' },
            Emailadres: { type: 'string', format: 'email', description: 'Email address', example: 'john.doe@example.com' },
            Telefoonnummer: { type: 'string', description: 'Phone number', example: '+31612345678' },
            Notities: { type: 'string', description: 'Notes', example: 'Preferred appointment time: afternoon' },
            IsExported: { type: 'boolean', description: 'Export status', example: false },
            IsAllowContactShare: { type: 'string', description: 'Contact sharing permission', example: 'YES' }
          },
          required: ['Naam', 'Contactpersoon', 'Emailadres', 'Telefoonnummer']
        },
        DogInput: {
          type: 'object',
          properties: {
            CustomerId: { type: 'integer', description: 'ID of the owner (customer)', example: 42 },
            Name: { type: 'string', description: 'Dog name', example: 'Max' },
            Birthday: { type: 'string', format: 'date', description: 'Dog birthday', example: '2020-01-15' },
            Allergies: { type: 'string', description: 'Allergies information', example: 'None' },
            ServiceNote: { type: 'string', description: 'Notes about service', example: 'Prefers gentle brushing' },
            DogSizeId: { type: 'string', description: 'Size category of the dog', example: 'M' },
            DogBreeds: { 
              type: 'array', 
              description: 'List of dog breed IDs', 
              items: { 
                type: 'string',
                description: 'Dog breed ID',
                example: 'labrador'
              }
            }
          },
          required: ['CustomerId', 'Name', 'DogSizeId']
        },
        DogDogbreedInput: {
          type: 'object',
          properties: {
            DogId: { type: 'integer', description: 'Dog ID', example: 1 },
            DogBreedId: { type: 'string', description: 'Breed ID', example: 'labrador' }
          },
          required: ['DogId', 'DogBreedId']
        },
        ExportLogInput: {
          type: 'object',
          properties: {
            IssuedOn: { type: 'string', format: 'date-time', description: 'Issue timestamp', example: '2024-03-07T10:00:00Z' },
            ForMonthDate: { type: 'string', format: 'date', description: 'Month of export', example: '2024-03-01' },
            IsSuccesfull: { type: 'boolean', description: 'Success status', example: true },
            IsDummy: { type: 'boolean', description: 'Dummy export flag', example: false }
          },
          required: ['IssuedOn', 'ForMonthDate']
        },
        InvoiceInput: {
          type: 'object',
          properties: {
            AppointmentId: { type: 'integer', description: 'Appointment ID', example: 1 },
            SerialNumber: { type: 'integer', description: 'Serial number', example: 20240001 },
            IsExported: { type: 'boolean', description: 'Export status', example: false },
            PaymentTypeId: { type: 'string', description: 'Payment type', example: 'BT' },
            Factuurnummer: { type: 'string', description: 'Invoice number', example: 'INV-2024-001' },
            Referentie: { type: 'string', description: 'Reference', example: 'REF-2024-001' },
            Factuurdatum: { type: 'string', format: 'date', description: 'Invoice date', example: '2024-03-07' },
            Vervaldatum: { type: 'string', format: 'date', description: 'Due date', example: '2024-04-06' },
            CustomCustomerId: { type: 'integer', description: 'Custom customer ID', example: 42 },
            IsIncludeInExport: { type: 'boolean', description: 'Include in export flag', example: true },
            IsPaid: { type: 'boolean', description: 'Payment status', example: false }
          },
          required: ['AppointmentId', 'PaymentTypeId', 'Factuurnummer', 'Factuurdatum']
        },
        InvoiceLineInput: {
          type: 'object',
          properties: {
            InvoiceId: { type: 'integer', description: 'Invoice ID', example: 1001 },
            Omschrijving: { type: 'string', description: 'Description', example: 'Dog grooming service - Medium size' },
            Aantal: { type: 'integer', description: 'Quantity', example: 1 },
            BTWpercentageId: { type: 'string', description: 'VAT percentage ID', example: '21' },
            Bedragexcl_btw: { type: 'number', format: 'decimal', description: 'Amount excluding VAT', example: 50.00 },
            Categorie: { type: 'string', description: 'Category', example: 'GROOMING' }
          },
          required: ['InvoiceId', 'Omschrijving', 'Aantal', 'BTWpercentageId', 'Bedragexcl_btw']
        },
        ServiceAppointmentDogInput: {
          type: 'object',
          properties: {
            AppointmentDogId: { type: 'integer', description: 'Appointment-Dog ID', example: 1 },
            ServiceId: { type: 'string', description: 'Service ID', example: 'trimmen' },
            Price: { type: 'number', format: 'decimal', description: 'Price', example: 60.00 }
          },
          required: ['AppointmentDogId', 'ServiceId']
        },
        TravelTimeInput: {
          type: 'object',
          properties: {
            AppointmentId: { type: 'integer', description: 'Appointment ID', example: 1 },
            TravelTimeTypeId: { type: 'string', description: 'Travel time type ID', example: 'HomeWork' },
            Duration: { type: 'integer', description: 'Duration in minutes', example: 30 }
          },
          required: ['AppointmentId', 'TravelTimeTypeId', 'Duration']
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
    // Use absolute paths to ensure files are found correctly
    path.join(basePath, 'routes', '*.ts'),
    path.join(basePath, 'routes', '**', '*.ts'),
    path.join(basePath, 'routes', '*.js'),
    path.join(basePath, 'routes', '**', '*.js')
  ],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions); 