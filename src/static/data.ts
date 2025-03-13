import {
    AppointmentStatus,
    AppointmentType,
    BTWPercentage,
    CustomColor,
    DogSize,
    HourType,
    ImportExportType,
    InvoiceCategory,
    PaymentType,
    TravelTimeType
} from './types';

export const appointmentStatuses: AppointmentStatus[] = [
    { Id: 'Can', Label: 'Geannuleerd', Order: 3, Is_Active: true, Color: 'Cancelled' },
    { Id: 'Exp', Label: 'Geexporteerd', Order: 7, Is_Active: true, Color: 'Exported' },
    { Id: 'Inv', Label: 'Gefactureerd', Order: 5, Is_Active: true, Color: 'Invoiced' },
    { Id: 'NotExp', Label: 'NotExported', Order: 8, Is_Active: true, Color: 'NotExported' },
    { Id: 'Pln', Label: 'Gepland', Order: 2, Is_Active: true, Color: 'Planned' }
];

export const appointmentTypes: AppointmentType[] = [
    { Id: 1, Label: 'DogWalking', Order: 2, Is_Active: true, LabelDutch: 'Uitlaatservice' },
    { Id: 2, Label: 'Absent', Order: 3, Is_Active: true, LabelDutch: 'Afwezigheid' },
    { Id: 3, Label: 'Grooming', Order: 1, Is_Active: true, LabelDutch: 'Trimmen' }
];

export const btwPercentages: BTWPercentage[] = [
    { Id: 1, Label: '21%', Amount: 21 },
    { Id: 2, Label: '0%', Amount: 0 }
];

export const customColors: CustomColor[] = [
    { Color: 'Cancelled', Order: 4, Hex: '#a80808', Legend: 'Geannuleerd' },
    { Color: 'Exported', Order: 3, Hex: '#74ed86', Legend: 'Geexporteerd' },
    { Color: 'Invoiced', Order: 2, Hex: '#4973de', Legend: 'Gefactureerd' },
    { Color: 'NotExported', Order: 6, Hex: '#b5cc8d', Legend: 'Niet geexporteerd' },
    { Color: 'OtherHours', Order: 5, Hex: '#57c2bb', Legend: 'Andere uren' },
    { Color: 'Planned', Order: 1, Hex: '#a9abb0', Legend: 'Geplanned' }
];

export const dogSizes: DogSize[] = [
    { Id: 'L', Label: 'Large', Order: 3, Is_Active: true },
    { Id: 'M', Label: 'Middle', Order: 2, Is_Active: true },
    { Id: 'S', Label: 'Small', Order: 1, Is_Active: true },
    { Id: 'X', Label: 'ExtraLarge', Order: 4, Is_Active: true }
];

export const hourTypes: HourType[] = [
    { Id: 'Adm', Label: 'Administratie', Order: 1, Is_Active: true, DefaultText: 'Administratie', IsExport: true },
    { Id: 'App', Label: 'Afspraak', Order: 10, Is_Active: true, DefaultText: null, IsExport: false },
    { Id: 'Cur', Label: 'Cursus', Order: 3, Is_Active: true, DefaultText: 'Cursus gevolgd', IsExport: true },
    { Id: 'Fac', Label: 'Factuur', Order: 5, Is_Active: true, DefaultText: null, IsExport: true },
    { Id: 'Ink', Label: 'Inkopen', Order: 2, Is_Active: true, DefaultText: 'Inkopen gedaan', IsExport: true },
    { Id: 'Reis', Label: 'Reistijd', Order: 6, Is_Active: true, DefaultText: 'Reistijd', IsExport: true },
    { Id: 'sch', Label: 'Schoonmaken', Order: 4, Is_Active: true, DefaultText: 'Trimsalon schoongemaakt', IsExport: true },
    { Id: 'Stage', Label: 'Stage trimsalon', Order: 7, Is_Active: true, DefaultText: 'Stage trimsalon', IsExport: true },
    { Id: 'Vak', Label: 'Vakantie', Order: 8, Is_Active: true, DefaultText: 'Vakantie', IsExport: false },
    { Id: 'Zk', Label: 'Ziek', Order: 9, Is_Active: true, DefaultText: 'Ziek', IsExport: false }
];

export const importExportTypes: ImportExportType[] = [
    { Id: 'Hour', Label: 'Hour' },
    { Id: 'Invoice', Label: 'Invoice' },
    { Id: 'Purchase', Label: 'Purchase' },
    { Id: 'Relation', Label: 'Relation' }
];

export const invoiceCategories: InvoiceCategory[] = [
    { Id: 1, Label: 'Paarden', Order: 3, Is_Active: true, Knab: 'Omzet Paarden' },
    { Id: 2, Label: 'Trimsalon', Order: 1, Is_Active: true, Knab: 'Omzet Trimsalon' },
    { Id: 3, Label: 'Chuck & Charlie', Order: 2, Is_Active: true, Knab: 'Omzet Chuck&Charlie' }
];

export const paymentTypes: PaymentType[] = [
    { Id: 'BT', Label: 'Bank', Order: 3, Is_Active: true, LabelDutch: null },
    { Id: 'Csh', Label: 'Cash', Order: 2, Is_Active: true, LabelDutch: null }
];

export const travelTimeTypes: TravelTimeType[] = [
    { Id: 1, Label: 'HomeWork', Order: 1, Is_Active: true },
    { Id: 2, Label: 'WorkHome', Order: 2, Is_Active: true }
]; 