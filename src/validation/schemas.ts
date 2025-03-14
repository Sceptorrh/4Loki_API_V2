import { z } from 'zod';

export const customerSchema = z.object({
  Naam: z.string().min(1, 'Name is required'),
  Contactpersoon: z.string().min(1, 'Contact person is required'),
  Emailadres: z.string().email('Invalid email address'),
  Telefoonnummer: z.string().min(1, 'Phone number is required'),
  Adres: z.string().min(1, 'Address is required'),
  Postcode: z.string().min(1, 'Postal code is required'),
  Stad: z.string().min(1, 'City is required'),
  Land: z.string().min(1, 'Country is required'),
  KvKnummer: z.string().optional(),
  Btwnummer: z.string().optional(),
  IBAN: z.string().optional(),
  Notities: z.string().optional(),
  IsAllowContactShare: z.string().optional(),
});

export const dogSchema = z.object({
  CustomerId: z.number().int().positive(),
  Name: z.string().min(1, 'Name is required'),
  Birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Birthday must be in YYYY-MM-DD format'),
  Allergies: z.string().optional(),
  ServiceNote: z.string().optional(),
  DogSizeId: z.string().min(1, 'Dog size is required'),
  DogBreeds: z.array(z.string()).optional()
});

export const appointmentSchema = z.object({
  Date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  TimeStart: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  TimeEnd: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  DateEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  ActualDuration: z.number().int().min(0),
  CustomerId: z.number().int().positive(),
  AppointmentStatusId: z.string().min(1, 'Appointment status is required'),
  AppointmentTypeId: z.string().min(1),
  Note: z.string().optional()
});

export const invoiceSchema = z.object({
  AppointmentId: z.number().int().positive(),
  SerialNumber: z.number().int().positive(),
  PaymentTypeId: z.string().min(1, 'Payment type is required'),
  Factuurnummer: z.string().min(1, 'Invoice number is required'),
  Referentie: z.string().optional(),
  Factuurdatum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  Vervaldatum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  CustomCustomerId: z.number().int().positive().optional(),
  IsExported: z.boolean().optional()
});

export const serviceSchema = z.object({
  Id: z.string().min(1, 'ID is required'),
  Name: z.string().min(1, 'Name is required'),
  StandardPrice: z.number().optional(),
  IsPriceAllowed: z.boolean().optional(),
  StandardDuration: z.number().int().optional(),
  Order: z.number().int().min(0)
});

export const additionalHourSchema = z.object({
  HourTypeId: z.string().min(1, 'Hour type is required'),
  Duration: z.number().int().min(1),
  Date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  DateEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  StartTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  EndTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  IsShowOnPlanning: z.boolean(),
  Description: z.string().optional(),
  InvoiceId: z.number().int().positive().optional(),
  IsExported: z.boolean().optional()
});

export const exportLogSchema = z.object({
  IssuedOn: z.string().datetime(),
  ForMonthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  IsSuccesfull: z.boolean(),
  IsDummy: z.boolean(),
});

export const travelTimeSchema = z.object({
  AppointmentId: z.number().int().positive(),
  TravelTimeTypeId: z.number().int().positive(),
  Duration: z.number().int().min(0)
});

export const dogBreedSchema = z.object({
  Id: z.string().min(1, 'ID is required'),
  Name: z.string().min(1, 'Name is required'),
  Order: z.number().int().min(0)
});

export const appointmentDogSchema = z.object({
  AppointmentId: z.number().int().positive(),
  DogId: z.number().int().positive(),
  Note: z.string().optional()
});

export const serviceAppointmentDogSchema = z.object({
  AppointmentDogId: z.number().int().positive(),
  ServiceId: z.string().min(1, 'Service ID is required'),
  Price: z.number().min(0, 'Price must be a positive number')
});

export const completeAppointmentSchema = z.object({
  appointment: appointmentSchema,
  appointmentDogs: z.array(
    z.object({
      DogId: z.number().int().positive(),
      Note: z.string().optional(),
      services: z.array(
        z.object({
          ServiceId: z.string().min(1, 'Service ID is required'),
          Price: z.number().min(0, 'Price must be a positive number')
        })
      )
    })
  )
}); 