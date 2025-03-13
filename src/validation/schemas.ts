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
  OwnerId: z.number().int().positive().optional()
});

export const appointmentSchema = z.object({
  Date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  TimeStart: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  TimeEnd: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  DateEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  ActualDuration: z.number().int().min(0),
  CustomerId: z.number().int().positive(),
  AppointmentStatusId: z.string().min(1, 'Appointment status is required'),
  TipAmount: z.number().min(0).optional(),
  AppointmentTypeId: z.number().int().positive(),
  Note: z.string().optional(),
  ReasonForCancellation: z.string().optional(),
});

export const invoiceSchema = z.object({
  AppointmentId: z.number().int().positive(),
  SerialNumber: z.number().int().positive(),
  PaymentTypeId: z.string().min(1, 'Payment type is required'),
  Factuurnummer: z.string().min(1, 'Invoice number is required'),
  Referentie: z.string().optional(),
  Factuurdatum: z.string().datetime(),
  Vervaldatum: z.string().datetime(),
  CustomCustomerId: z.number().int().positive().optional(),
  IsPaid: z.boolean().optional(),
});

export const serviceSchema = z.object({
  Name: z.string().min(1, 'Name is required'),
  StandardPrice: z.number().min(0),
  IsPrice0Allowed: z.boolean(),
  StandardDuration: z.number().int().min(1),
});

export const dogPictureSchema = z.object({
  DogId: z.number().int().positive(),
  AppointmentId: z.number().int().positive(),
  DateTime: z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/, 'DateTime must be in YYYY-MM-DD HH:mm:ss format'),
  OwnerId: z.number().int().positive().optional(),
  Picture: z.string()
});

export const additionalHourSchema = z.object({
  HourTypeId: z.string().min(1, 'Hour type is required'),
  Duration: z.number().int().min(1),
  Date: z.string().datetime(),
  DateEnd: z.string().datetime(),
  StartTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  EndTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  IsShowOnPlanning: z.boolean(),
  Description: z.string().optional(),
  InvoiceId: z.number().int().positive().optional(),
  IsSkippedExport: z.boolean().optional(),
});

export const exportLogSchema = z.object({
  IssuedOn: z.string().datetime(),
  ForMonthDate: z.string().datetime(),
  IsSuccesfull: z.boolean(),
  IsDummy: z.boolean(),
});

export const travelTimeSchema = z.object({
  Type: z.string().min(1, 'Type is required'),
  DateTime: z.string().datetime(),
  Value: z.number().int().min(0),
});

export const dogBreedSchema = z.object({
  Name: z.string().min(1, 'Name is required'),
  OwnerId: z.number().int().positive().optional()
}); 