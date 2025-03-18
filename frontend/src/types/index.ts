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
}

// Customer interface
export interface Customer {
  // API response properties from /api/v1/customers/table
  Id?: number;
  Contactpersoon?: string;
  Naam?: string;
  Emailadres?: string;
  Telefoonnummer?: string;
  Notities?: string;
  IsAllowContactShare?: string;
  IsExported?: boolean;
  DogCount?: number;
  Dogs?: (string | Dog)[];
  DaysSinceLastAppointment?: number;
  AppointmentCount?: number;
  IsActive?: boolean;
  
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
  // Frontend expected properties (lowercase)
  id?: number;
  date?: string;
  time?: string;
  customer_id?: number;
  customer_name?: string;
  status?: string;
  statusLabel?: string;
  notes?: string;
  dogs?: Dog[];
  isPaidInCash?: boolean;
  actualDuration?: number;
  daysSincePrevious?: number | null;
  
  // Backend properties (uppercase)
  Id?: number;
  Date?: string;
  TimeStart?: string;
  TimeEnd?: string;
  DateEnd?: string;
  CustomerId?: number;
  ContactPerson?: string;
  CustomerName?: string;
  Status?: {
    Id: string;
    Label: string;
    Color: string;
  };
  StatusLabel?: string;
  AppointmentStatusId?: string;
  Note?: string;
  Dogs?: Dog[];
  AppointmentId?: number;
  IsPaidInCash?: boolean | number;
  ActualDuration?: number;
}

// Service interface
export interface Service {
  Id: string;
  Name: string;
  Description?: string;
  Price: number;
  Order?: number;
} 