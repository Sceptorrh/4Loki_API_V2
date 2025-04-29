// Dog Breed interface
export interface DogBreed {
  Id: string;
  Name: string;
  Order?: number;
  
  // Alternative property names (for API compatibility)
  id?: string;
  name?: string;
  order?: number;
}

// Dog Size interface
export interface DogSize {
  Id?: string;
  Name?: string;
  
  // Properties from /static/dog-sizes endpoint
  id?: string;
  label?: string;
  order?: number;
}

// Dog interface
export interface Dog {
  Id: number;
  CustomerId: number;
  Name: string;
  Birthday?: string;
  Allergies?: string;
  ServiceNote?: string;
  DogSizeId?: string;
  CreatedOn?: string;
  UpdatedOn?: string;
  DogBreeds?: DogBreed[];
  DogSize?: DogSize;
  Size?: string;
  
  // Properties from the table endpoint
  BreedNames?: string;
  SizeName?: string;
  CustomerName?: string;
  Contactpersoon?: string;
  Breeds?: DogBreed[];
  
  // Alternative property names (for API compatibility)
  id?: number;
  customerId?: number;
  name?: string;
  birthday?: string;
  allergies?: string;
  serviceNote?: string;
  dogSizeId?: string;
  createdOn?: string;
  updatedOn?: string;
  dogBreeds?: DogBreed[];
  dogSize?: DogSize;
  size?: string;
  customerName?: string;
  contactpersoon?: string;
  appointments?: Appointment[];
  Appointments?: Appointment[];
}

// Customer interface
export interface Customer {
  // API response properties from /api/v1/customers/table
  Id?: number;
  Name?: string;
  Contactperson?: string;
  Email?: string;
  Phone?: string;
  Notes?: string;
  IsAllowContactShare?: string;
  IsExported?: boolean;
  DogCount?: number;
  Dogs?: (string | Dog)[];
  DaysSinceLastAppointment?: number;
  AppointmentCount?: number;
  IsActive?: boolean;
  AverageInterval?: number;
  
  // Legacy properties (keeping for backward compatibility)
  id?: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  notes?: string;
  dogs?: Dog[];
  days_since_last_appointment?: number | null;
}

// Appointment interface
export interface Appointment {
  Id: number;
  Date: string;
  TimeStart: string;
  TimeEnd: string;
  DateEnd: string;
  ActualDuration: number;
  CustomerId: number;
  AppointmentStatusId: string;
  Note: string;
  SerialNumber: number;
  IsPaidInCash: boolean;
  CreatedOn: string;
  UpdatedOn: string;
  Dogs?: Array<{
    Id: number;
    Name: string;
  } | string>;
  
  // Alternative property names (for API compatibility)
  id?: number;
  date?: string;
  timeStart?: string;
  timeEnd?: string;
  dateEnd?: string;
  actualDuration?: number;
  customerId?: number;
  appointmentStatusId?: string;
  note?: string;
  serialNumber?: number;
  isPaidInCash?: boolean;
  createdOn?: string;
  updatedOn?: string;
  dogs?: Array<{
    id?: number;
    name?: string;
  } | string>;
}

// Service interface
export interface Service {
  Id: string;
  Name: string;
  Description?: string;
  Price: number;
  Order?: number;
}

export interface NavigationSettings {
  Id: number;
  HomeAddress: string;
  WorkAddress: string;
  ApiKey?: string;
  UpdatedOn: Date;
} 