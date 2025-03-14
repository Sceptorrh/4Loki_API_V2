export interface Customer {
  Id: number;
  Naam: string;
  Contactpersoon: string;
  Emailadres: string;
  Telefoonnummer: string;
  Notities: string;
  CreatedOn: Date;
  UpdatedOn: Date;
  IsExported: boolean;
  IsAllowContactShare: string;
}

export interface Dog {
  Id: number;
  CustomerId: number;
  Name: string;
  Birthday: Date;
  Allergies: string;
  ServiceNote: string;
  CreatedOn: Date;
  UpdatedOn: Date;
  DogSizeId: string;
  DogBreeds?: DogBreed[];
}

export interface DogBreed {
  Id: string;
  Name: string;
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
  AppointmentTypeId: string;
  Note: string;
  CreatedOn: Date;
  UpdatedOn: Date;
  TipAmount: number;
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
  IsIncludeInExport: boolean;
  CustomCustomerId: number;
  IsPaid: boolean;
  CreatedOn: Date;
  UpdatedOn: Date;
}

export interface Service {
  Id: string;
  Name: string;
  StandardPrice: number;
  IsPriceAllowed: boolean;
  StandardDuration: number;
  Order: number;
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
  InvoiceId: number;
  CreatedOn: Date;
  UpdatedOn: Date;
}

export interface ExportLog {
  Id: number;
  IssuedOn: Date;
  ForMonthDate: Date;
  IsSuccesfull: boolean;
  IsDummy: boolean;
  CreatedOn: Date;
  UpdatedOn: Date;
}

export interface TravelTime {
  Id: number;
  AppointmentId: number;
  TravelTimeTypeId: string;
  Duration: number;
  CreatedOn: Date;
  UpdatedOn: Date;
}

export interface AppointmentDog {
  Id: number;
  AppointmentId: number;
  DogId: number;
  Note: string;
  CreatedOn: Date;
  UpdatedOn: Date;
}

export interface DogDogbreed {
  Id: number;
  DogId: number;
  DogBreedId: string;
  CreatedOn: Date;
  UpdatedOn: Date;
}

export interface InvoiceLine {
  Id: number;
  InvoiceId: number;
  Omschrijving: string;
  Aantal: number;
  BTWpercentageId: string;
  Bedragexcl_btw: number;
  Categorie: string;
  CreatedOn: Date;
  UpdatedOn: Date;
}

export interface ServiceAppointmentDog {
  Id: number;
  ServiceId: string;
  AppointmentDogId: number;
  Price: number;
  CreatedOn: Date;
  UpdatedOn: Date;
} 