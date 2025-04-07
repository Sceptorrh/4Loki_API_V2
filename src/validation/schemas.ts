import { z } from 'zod';

export const customerSchema = z.object({
  Naam: z.string().min(1, 'Name is required'),
  Contactpersoon: z.string().min(1, 'Contact person is required'),
  Emailadres: z.string().email('Invalid email address').optional(),
  Telefoonnummer: z.string().min(1, 'Phone number is required'),
  Notities: z.string().optional(),
  IsAllowContactShare: z.union([
    z.enum(['yes', 'no', 'unknown']),
    z.literal(null),
    z.string().length(0).transform(() => null),
    z.undefined().transform(() => null)
  ]).optional().nullable(),
});

export const dogSchema = z.object({
  CustomerId: z.number().int().positive(),
  Name: z.string().min(1, 'Name is required'),
  Birthday: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Birthday must be in YYYY-MM-DD format'),
    z.string().length(0).transform(() => null),
    z.null(),
    z.undefined().transform(() => null)
  ]).optional().transform(val => val || null),
  Allergies: z.string().optional(),
  ServiceNote: z.string().optional(),
  DogSizeId: z.string().optional().nullable(),
  DogBreeds: z.array(z.union([z.string(), z.object({}).transform(() => '')])).optional()
});

export const appointmentSchema = z.object({
  Date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  TimeStart: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  TimeEnd: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  DateEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  ActualDuration: z.number().int().min(0),
  CustomerId: z.number().int().positive(),
  AppointmentStatusId: z.string().min(1, 'Appointment status is required'),
  Note: z.string().optional(),
  SerialNumber: z.number().int().positive().optional(),
  IsPaidInCash: z.boolean().optional()
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
  Description: z.string().optional(),
  IsExported: z.union([
    z.boolean(),
    z.literal(0).transform(() => false),
    z.literal(1).transform(() => true)
  ]).optional()
});

export const exportLogSchema = z.object({
  IssuedOn: z.string().refine(
    (val) => {
      // Accept both MySQL datetime format (YYYY-MM-DD HH:MM:SS) and ISO format
      return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(val) || // MySQL format
             /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/.test(val); // ISO format
    },
    { message: "IssuedOn must be in 'YYYY-MM-DD HH:MM:SS' format or ISO datetime format" }
  ),
  UpUntilDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  IsSuccesfull: z.boolean(),
  IsDummy: z.boolean(),
  FileName: z.string().optional(),
  Notes: z.string().optional(),
  AppointmentIds: z.array(z.number().int().positive()).optional(),
});

export const revertExportSchema = z.object({
  RevertedBy: z.string().optional(),
  RevertReason: z.string().optional(),
});

export const travelTimeSchema = z.object({
  IsHomeToWork: z.boolean(),
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