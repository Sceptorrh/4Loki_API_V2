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
  
  // Properties from the table endpoint
  BreedNames?: string;
  SizeName?: string;
  CustomerName?: string;
  
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
  Dogs?: string[];
  DaysSinceLastAppointment?: number;
  
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
  id: number;
  date: string;
  time: string;
  customer_id: number;
  customer_name?: string;
  status: string;
  notes?: string;
  dogs?: Dog[];
}

// Invoice interface
export interface Invoice {
  id: number;
  appointment_id: number;
  customer_id: number;
  amount: number;
  status: string;
  date: string;
  due_date: string;
  notes?: string;
}

// Service interface
export interface Service {
  Id: string;
  Name: string;
  Description?: string;
  Price: number;
  Order?: number;
} 