export interface Customer {
  Id: number;
  Naam: string;
  Contactpersoon: string;
  Emailadres: string;
  Telefoonnummer: string;
  Adres: string;
  Postcode: string;
  Stad: string;
  Land: string;
  KvKnummer: string;
  Btwnummer: string;
  IBAN: string;
  Notities: string;
  OwnerId: number;
  CreatedOn: Date;
  UpdatedOn: Date;
  IsExported: boolean;
  HasChanged: boolean;
  IsAllowContactShare: string;
}

export interface Dog {
  Id: number;
  CustomerId: number;
  Name: string;
  Birthday: Date;
  Allergies: string;
  ServiceNote: string;
  OwnerId: number;
  CreatedOn: Date;
  UpdatedOn: Date;
  DogSizeId: string;
}

export interface Appointment {
  Id: number;
  Date: Date;
  TimeStart: string;
  TimeEnd: string;
  DateEnd: Date;
  ActualDuration: number;
  CustomerId: number;
  AppointmentStatusId: string;
  CreatedOn: Date;
  UpdatedOn: Date;
  TipAmount: number;
  AppointmentTypeId: string;
  Owner: number;
  Note: string;
  ReasonForCancellation: string;
}

export interface Invoice {
  Id: number;
  AppointmentId: number;
  SerialNumber: number;
  IsExported: boolean;
  PaymentTypeId: string;
  Factuurnummer: string;
  Referentie: string;
  Factuurdatum: Date;
  Vervaldatum: Date;
  OwnerId: number;
  IsIncludeInExport: boolean;
  CustomCustomerId: number;
  IsPaid: boolean;
}

export interface Service {
  Id: number;
  Name: string;
  StandardPrice: number;
  IsPrice0Allowed: boolean;
  StandardDuration: number;
  OwnerId: number;
}

export interface AdditionalHour {
  Id: number;
  HourTypeId: string;
  Duration: number;
  Date: Date;
  DateEnd: Date;
  StartTime: string;
  EndTime: string;
  IsShowOnPlanning: boolean;
  Description: string;
  IsExported: boolean;
  OwnerId: number;
  InvoiceId: number;
  IsSkippedExport: boolean;
}

export interface ExportLog {
  Id: number;
  IssuedOn: Date;
  ForMonthDate: Date;
  OwnerId: number;
  IsSuccesfull: boolean;
  IsDummy: boolean;
}

export interface TravelTime {
  Id: number;
  Type: string;
  DateTime: Date;
  Value: number;
} 