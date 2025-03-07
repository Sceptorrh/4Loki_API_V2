import { SwaggerOptions } from 'swagger-ui-express';

export const swaggerOptions: SwaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '4Loki API',
      version: '1.0.0',
      description: 'API for 4Loki dog grooming business management system',
      contact: {
        name: 'API Support',
        email: 'support@4loki.com'
      },
    },
    servers: [
      {
        url: 'http://localhost:3010/api/v1',
        description: 'Development server'
      }
    ],
    components: {
      schemas: {
        Customer: {
          type: 'object',
          properties: {
            Id: { type: 'integer' },
            Naam: { type: 'string' },
            Contactpersoon: { type: 'string' },
            Emailadres: { type: 'string', format: 'email' },
            Telefoonnummer: { type: 'string' },
            Adres: { type: 'string' },
            Postcode: { type: 'string' },
            Stad: { type: 'string' },
            Land: { type: 'string' },
            KvKnummer: { type: 'string' },
            Btwnummer: { type: 'string' },
            IBAN: { type: 'string' },
            Notities: { type: 'string' },
            OwnerId: { type: 'integer' },
            CreatedOn: { type: 'string', format: 'date-time' },
            UpdatedOn: { type: 'string', format: 'date-time' },
            IsExported: { type: 'boolean' },
            HasChanged: { type: 'boolean' },
            IsAllowContactShare: { type: 'string' }
          }
        },
        Dog: {
          type: 'object',
          properties: {
            Id: { type: 'integer' },
            CustomerId: { type: 'integer' },
            Name: { type: 'string' },
            Birthday: { type: 'string', format: 'date' },
            Allergies: { type: 'string' },
            ServiceNote: { type: 'string' },
            OwnerId: { type: 'integer' },
            CreatedOn: { type: 'string', format: 'date-time' },
            UpdatedOn: { type: 'string', format: 'date-time' },
            DogSizeId: { type: 'string' }
          }
        },
        Appointment: {
          type: 'object',
          properties: {
            Id: { type: 'integer' },
            Date: { type: 'string', format: 'date' },
            TimeStart: { type: 'string', format: 'time' },
            TimeEnd: { type: 'string', format: 'time' },
            DateEnd: { type: 'string', format: 'date' },
            ActualDuration: { type: 'integer' },
            CustomerId: { type: 'integer' },
            AppointmentStatusId: { type: 'string' },
            CreatedOn: { type: 'string', format: 'date-time' },
            UpdatedOn: { type: 'string', format: 'date-time' },
            TipAmount: { type: 'number' },
            AppointmentTypeId: { type: 'integer' },
            Owner: { type: 'integer' },
            Note: { type: 'string' },
            ReasonForCancellation: { type: 'string' }
          }
        },
        Invoice: {
          type: 'object',
          properties: {
            Id: { type: 'integer' },
            AppointmentId: { type: 'integer' },
            SerialNumber: { type: 'integer' },
            IsExported: { type: 'boolean' },
            PaymentTypeId: { type: 'string' },
            Factuurnummer: { type: 'string' },
            Referentie: { type: 'string' },
            Factuurdatum: { type: 'string', format: 'date' },
            Vervaldatum: { type: 'string', format: 'date' },
            OwnerId: { type: 'integer' },
            IsIncludeInExport: { type: 'boolean' },
            CustomCustomerId: { type: 'integer' },
            IsPaid: { type: 'boolean' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.ts']
}; 