export interface AppointmentStatus {
    Id: string;
    Label: string;
    Order: number;
    Is_Active: boolean;
    Color: string;
}

export interface AppointmentType {
    Id: number;
    Label: string;
    Order: number;
    Is_Active: boolean;
    LabelDutch: string;
}

export interface BTWPercentage {
    Id: number;
    Label: string;
    Amount: number;
}

export interface CustomColor {
    Color: string;
    Order: number;
    Hex: string;
    Legend: string;
}

export interface DogSize {
    Id: string;
    Label: string;
    Order: number;
    Is_Active: boolean;
}

export interface HourType {
    Id: string;
    Label: string;
    Order: number;
    Is_Active: boolean;
    DefaultText: string | null;
    IsExport: boolean;
}

export interface ImportExportType {
    Id: string;
    Label: string;
}

export interface InvoiceCategory {
    Id: number;
    Label: string;
    Order: number;
    Is_Active: boolean;
    Knab: string;
}

export interface PaymentType {
    Id: string;
    Label: string;
    Order: number;
    Is_Active: boolean;
    LabelDutch: string | null;
}

export interface TravelTimeType {
    Id: number;
    Label: string;
    Order: number;
    Is_Active: boolean;
} 