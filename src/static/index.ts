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
import {
    appointmentStatuses,
    appointmentTypes,
    btwPercentages,
    customColors,
    dogSizes,
    hourTypes,
    importExportTypes,
    invoiceCategories,
    paymentTypes,
    travelTimeTypes
} from './data';

export * from './types';
export * from './data';

// Utility functions for accessing static data
export const getAppointmentStatusById = (id: string): AppointmentStatus | undefined => 
    appointmentStatuses.find((status: AppointmentStatus) => status.Id === id);

export const getAppointmentTypeById = (id: number): AppointmentType | undefined => 
    appointmentTypes.find((type: AppointmentType) => type.Id === id);

export const getBTWPercentageById = (id: number): BTWPercentage | undefined => 
    btwPercentages.find((btw: BTWPercentage) => btw.Id === id);

export const getCustomColorByColor = (color: string): CustomColor | undefined => 
    customColors.find((c: CustomColor) => c.Color === color);

export const getDogSizeById = (id: string): DogSize | undefined => 
    dogSizes.find((size: DogSize) => size.Id === id);

export const getHourTypeById = (id: string): HourType | undefined => 
    hourTypes.find((type: HourType) => type.Id === id);

export const getImportExportTypeById = (id: string): ImportExportType | undefined => 
    importExportTypes.find((type: ImportExportType) => type.Id === id);

export const getInvoiceCategoryById = (id: number): InvoiceCategory | undefined => 
    invoiceCategories.find((category: InvoiceCategory) => category.Id === id);

export const getPaymentTypeById = (id: string): PaymentType | undefined => 
    paymentTypes.find((type: PaymentType) => type.Id === id);

export const getTravelTimeTypeById = (id: number): TravelTimeType | undefined => 
    travelTimeTypes.find((type: TravelTimeType) => type.Id === id);

// Helper function to get all active items
export const getActiveItems = <T extends { Is_Active: boolean }>(items: T[]): T[] =>
    items.filter(item => item.Is_Active);

// Helper function to get items sorted by Order
export const getOrderedItems = <T extends { Order: number }>(items: T[]): T[] =>
    [...items].sort((a, b) => a.Order - b.Order); 