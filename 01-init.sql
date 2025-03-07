/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS `4loki` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `4loki`;

-- Disable foreign key checks during table creation
SET FOREIGN_KEY_CHECKS = 0;

-- Create tables in order (handling foreign key dependencies)
CREATE TABLE IF NOT EXISTS `Statics_CustomColor` (
  `Color` varchar(50) NOT NULL,
  `Order` int(11) DEFAULT NULL,
  `Hex` varchar(9) DEFAULT NULL,
  `Legend` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`Color`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Statics_AppointmentStatus` (
  `Id` varchar(50) NOT NULL,
  `Label` varchar(255) DEFAULT NULL,
  `Order` int(11) DEFAULT NULL,
  `Is_Active` tinyint(1) DEFAULT NULL,
  `Color` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `Color` (`Color`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Statics_AppointmentType` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `Label` varchar(255) DEFAULT NULL,
  `Order` int(11) DEFAULT NULL,
  `Is_Active` tinyint(1) DEFAULT NULL,
  `LabelDutch` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Statics_BTWpercentage` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `Label` varchar(255) DEFAULT NULL,
  `Amount` int(11) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Statics_DogSize` (
  `Id` varchar(50) NOT NULL,
  `Label` varchar(255) DEFAULT NULL,
  `Order` int(11) DEFAULT NULL,
  `Is_Active` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Statics_HourType` (
  `Id` varchar(50) NOT NULL,
  `Label` varchar(255) DEFAULT NULL,
  `Order` int(11) DEFAULT NULL,
  `Is_Active` tinyint(1) DEFAULT NULL,
  `DefaultText` text DEFAULT NULL,
  `IsExport` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Statics_ImportExportType` (
  `Id` varchar(50) NOT NULL,
  `Label` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Statics_InvoiceCategory` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `Label` varchar(255) DEFAULT NULL,
  `Order` int(11) DEFAULT NULL,
  `Is_Active` tinyint(1) DEFAULT NULL,
  `Knab` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Statics_PaymentType` (
  `Id` varchar(50) NOT NULL,
  `Label` varchar(255) DEFAULT NULL,
  `Order` int(11) DEFAULT NULL,
  `Is_Active` tinyint(1) DEFAULT NULL,
  `LabelDutch` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Statics_TravelTimeType` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `Label` varchar(255) DEFAULT NULL,
  `Order` int(11) DEFAULT NULL,
  `Is_Active` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Customer` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `Naam` varchar(255) DEFAULT NULL,
  `Contactpersoon` varchar(255) DEFAULT NULL,
  `Emailadres` varchar(255) DEFAULT NULL,
  `Telefoonnummer` varchar(50) DEFAULT NULL,
  `Adres` varchar(100) DEFAULT NULL,
  `Postcode` varchar(50) DEFAULT NULL,
  `Stad` varchar(50) DEFAULT NULL,
  `Land` varchar(50) DEFAULT NULL,
  `KvKnummer` varchar(50) DEFAULT NULL,
  `Btwnummer` varchar(50) DEFAULT NULL,
  `IBAN` varchar(50) DEFAULT NULL,
  `Notities` text DEFAULT NULL,
  `OwnerId` int(11) DEFAULT NULL,
  `CreatedOn` datetime DEFAULT NULL,
  `UpdatedOn` datetime DEFAULT NULL,
  `IsExported` tinyint(1) DEFAULT NULL,
  `HasChanged` tinyint(1) DEFAULT NULL,
  `IsAllowContactShare` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `customer_naam_unique` (`Naam`)
) ENGINE=InnoDB AUTO_INCREMENT=256 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Dog` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `CustomerId` int(11) DEFAULT NULL,
  `Name` varchar(255) DEFAULT NULL,
  `Birthday` date DEFAULT NULL,
  `Allergies` text DEFAULT NULL,
  `ServiceNote` text DEFAULT NULL,
  `OwnerId` int(11) DEFAULT NULL,
  `CreatedOn` datetime DEFAULT NULL,
  `UpdatedOn` datetime DEFAULT NULL,
  `DogSizeId` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `DogSizeId` (`DogSizeId`),
  KEY `Dog_ibfk_1` (`CustomerId`),
  CONSTRAINT `Dog_ibfk_1` FOREIGN KEY (`CustomerId`) REFERENCES `Customer` (`Id`) ON DELETE CASCADE,
  CONSTRAINT `Dog_ibfk_2` FOREIGN KEY (`DogSizeId`) REFERENCES `Statics_DogSize` (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=230 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Appointment` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `Date` date DEFAULT NULL,
  `TimeStart` time DEFAULT NULL,
  `TimeEnd` time DEFAULT NULL,
  `DateEnd` date DEFAULT NULL,
  `ActualDuration` int(11) DEFAULT NULL,
  `CustomerId` int(11) DEFAULT NULL,
  `AppointmentStatusId` varchar(50) DEFAULT NULL,
  `CreatedOn` datetime DEFAULT NULL,
  `UpdatedOn` datetime DEFAULT NULL,
  `TipAmount` decimal(10,2) DEFAULT NULL,
  `AppointmentTypeId` int(11) DEFAULT NULL,
  `Owner` int(11) DEFAULT NULL,
  `Note` text DEFAULT NULL,
  `ReasonForCancellation` text DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `CustomerId` (`CustomerId`),
  KEY `AppointmentStatusId` (`AppointmentStatusId`),
  KEY `AppointmentTypeId` (`AppointmentTypeId`),
  KEY `Id` (`Id`),
  KEY `Date` (`Date`),
  CONSTRAINT `Appointment_ibfk_1` FOREIGN KEY (`CustomerId`) REFERENCES `Customer` (`Id`),
  CONSTRAINT `Appointment_ibfk_2` FOREIGN KEY (`AppointmentStatusId`) REFERENCES `Statics_AppointmentStatus` (`Id`),
  CONSTRAINT `Appointment_ibfk_3` FOREIGN KEY (`AppointmentTypeId`) REFERENCES `Statics_AppointmentType` (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=882 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `AppointmentDog` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `AppointmentId` int(11) NOT NULL,
  `DogId` int(11) NOT NULL,
  `Note` text DEFAULT NULL,
  `OwnerId` int(11) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `DogId` (`DogId`),
  KEY `AppointmentDog_ibfk_1` (`AppointmentId`),
  CONSTRAINT `AppointmentDog_ibfk_1` FOREIGN KEY (`AppointmentId`) REFERENCES `Appointment` (`Id`) ON DELETE CASCADE,
  CONSTRAINT `AppointmentDog_ibfk_2` FOREIGN KEY (`DogId`) REFERENCES `Dog` (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=2223 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Invoice` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `AppointmentId` int(11) DEFAULT NULL,
  `SerialNumber` int(11) DEFAULT NULL,
  `IsExported` tinyint(1) DEFAULT NULL,
  `PaymentTypeId` varchar(50) DEFAULT NULL,
  `Factuurnummer` varchar(255) DEFAULT NULL,
  `Referentie` varchar(255) DEFAULT NULL,
  `Factuurdatum` date DEFAULT NULL,
  `Vervaldatum` date DEFAULT NULL,
  `OwnerId` int(11) DEFAULT NULL,
  `IsIncludeInExport` tinyint(1) DEFAULT NULL,
  `CustomCustomerId` int(11) DEFAULT NULL,
  `IsPaid` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `AppointmentId` (`AppointmentId`),
  KEY `CustomCustomerId` (`CustomCustomerId`),
  KEY `PaymentTypeId` (`PaymentTypeId`),
  CONSTRAINT `Invoice_ibfk_1` FOREIGN KEY (`AppointmentId`) REFERENCES `Appointment` (`Id`),
  CONSTRAINT `Invoice_ibfk_2` FOREIGN KEY (`CustomCustomerId`) REFERENCES `Customer` (`Id`),
  CONSTRAINT `Invoice_ibfk_3` FOREIGN KEY (`PaymentTypeId`) REFERENCES `Statics_PaymentType` (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=1047 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `AdditionalHour` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `HourTypeId` varchar(20) DEFAULT NULL,
  `Duration` int(11) DEFAULT NULL,
  `Date` date DEFAULT NULL,
  `DateEnd` date DEFAULT NULL,
  `StartTime` time DEFAULT NULL,
  `EndTime` time DEFAULT NULL,
  `IsShowOnPlanning` tinyint(1) DEFAULT NULL,
  `Description` text DEFAULT NULL,
  `IsExported` tinyint(1) DEFAULT NULL,
  `OwnerId` int(11) NOT NULL,
  `InvoiceId` int(11) DEFAULT NULL,
  `IsSkippedExport` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `InvoiceId` (`InvoiceId`),
  KEY `HourTypeId` (`HourTypeId`),
  CONSTRAINT `AdditionalHour_ibfk_1` FOREIGN KEY (`InvoiceId`) REFERENCES `Invoice` (`Id`),
  CONSTRAINT `AdditionalHour_ibfk_2` FOREIGN KEY (`HourTypeId`) REFERENCES `Statics_HourType` (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=443 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Dogbreed` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) DEFAULT NULL,
  `OwnerId` int(11) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `DogDogbreed` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `DogId` int(11) NOT NULL,
  `DogBreedId` int(11) NOT NULL,
  `OwnerId` int(11) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `DogBreedId` (`DogBreedId`),
  KEY `DogDogbreed_ibfk_1` (`DogId`),
  CONSTRAINT `DogDogbreed_ibfk_1` FOREIGN KEY (`DogId`) REFERENCES `Dog` (`Id`) ON DELETE CASCADE,
  CONSTRAINT `DogDogbreed_ibfk_2` FOREIGN KEY (`DogBreedId`) REFERENCES `Dogbreed` (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `DogPicture` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `DogId` int(11) NOT NULL,
  `AppointmentId` int(11) DEFAULT NULL,
  `DateTime` datetime DEFAULT NULL,
  `OwnerId` int(11) DEFAULT NULL,
  `Picture` blob DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `AppointmentId` (`AppointmentId`),
  KEY `DogPicture_ibfk_1` (`DogId`),
  CONSTRAINT `DogPicture_ibfk_1` FOREIGN KEY (`DogId`) REFERENCES `Dog` (`Id`) ON DELETE CASCADE,
  CONSTRAINT `DogPicture_ibfk_2` FOREIGN KEY (`AppointmentId`) REFERENCES `Appointment` (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ExportLog` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `IssuedOn` datetime DEFAULT NULL,
  `ForMonthDate` date DEFAULT NULL,
  `OwnerId` int(11) DEFAULT NULL,
  `IsSuccesfull` tinyint(1) DEFAULT NULL,
  `IsDummy` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `InvoiceLine` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `InvoiceId` int(11) DEFAULT NULL,
  `Omschrijving` text DEFAULT NULL,
  `Aantal` int(11) DEFAULT NULL,
  `BTWpercentageId` int(11) DEFAULT NULL,
  `Bedragexcl_btw` decimal(10,2) DEFAULT NULL,
  `Categorie` varchar(255) DEFAULT NULL,
  `OwnerId` int(11) DEFAULT NULL,
  `InvoiceCategoryId` int(11) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `BTWpercentageId` (`BTWpercentageId`),
  KEY `InvoiceCategoryId` (`InvoiceCategoryId`),
  KEY `InvoiceLine_ibfk_1` (`InvoiceId`),
  CONSTRAINT `InvoiceLine_ibfk_1` FOREIGN KEY (`InvoiceId`) REFERENCES `Invoice` (`Id`) ON DELETE CASCADE,
  CONSTRAINT `InvoiceLine_ibfk_2` FOREIGN KEY (`BTWpercentageId`) REFERENCES `Statics_BTWpercentage` (`Id`),
  CONSTRAINT `InvoiceLine_ibfk_3` FOREIGN KEY (`InvoiceCategoryId`) REFERENCES `Statics_InvoiceCategory` (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=1218 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Service` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) DEFAULT NULL,
  `StandardPrice` decimal(10,2) DEFAULT NULL,
  `IsPrice0Allowed` tinyint(1) DEFAULT NULL,
  `StandardDuration` int(11) DEFAULT NULL,
  `OwnerId` int(11) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ServiceAppointmentDog` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `AppointmentDogId` int(11) DEFAULT NULL,
  `ServiceId` int(11) DEFAULT NULL,
  `Price` decimal(10,2) DEFAULT NULL,
  `OwnerId` int(11) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `ServiceId` (`ServiceId`),
  KEY `ServiceAppointmentDog_ibfk_1` (`AppointmentDogId`),
  CONSTRAINT `ServiceAppointmentDog_ibfk_1` FOREIGN KEY (`AppointmentDogId`) REFERENCES `AppointmentDog` (`Id`) ON DELETE CASCADE,
  CONSTRAINT `ServiceAppointmentDog_ibfk_2` FOREIGN KEY (`ServiceId`) REFERENCES `Service` (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=1951 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `TravelTime` (
  `Type` text NOT NULL,
  `DateTime` datetime NOT NULL,
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `Value` int(11) NOT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=10402 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `DigiBTW_Expenses` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `Status` varchar(50) DEFAULT NULL,
  `Date` date DEFAULT NULL,
  `InvoiceNumber` varchar(50) DEFAULT NULL,
  `PriceIncBTW` decimal(20,6) DEFAULT NULL,
  `PriceExlBTW` decimal(20,6) DEFAULT NULL,
  `BTW` decimal(20,6) DEFAULT NULL,
  `Relation` varchar(50) DEFAULT NULL,
  `Description` varchar(500) DEFAULT NULL,
  `Notes` varchar(500) DEFAULT NULL,
  `CustomerId` int(11) DEFAULT NULL,
  `CreatedOn` datetime DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `CustomerId` (`CustomerId`),
  CONSTRAINT `CustomerId` FOREIGN KEY (`CustomerId`) REFERENCES `Customer` (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

CREATE TABLE IF NOT EXISTS `DigiBTW_Invoices` (
  `Id` bigint(20) NOT NULL AUTO_INCREMENT,
  `Status` varchar(50) DEFAULT NULL,
  `Date` date DEFAULT NULL,
  `IncBTW` decimal(20,6) DEFAULT NULL,
  `ExcBTW` decimal(20,6) DEFAULT NULL,
  `BTW` decimal(20,6) DEFAULT NULL,
  `CustomerName` varchar(100) DEFAULT NULL,
  `CustomerContactName` varchar(100) DEFAULT NULL,
  `Email` varchar(100) DEFAULT NULL,
  `PhoneNumber` varchar(100) DEFAULT NULL,
  `Description` varchar(500) DEFAULT NULL,
  `InvoiceNumber` varchar(50) DEFAULT NULL,
  `Reminders` tinyint(4) DEFAULT NULL,
  `Reference` varchar(100) DEFAULT NULL,
  `CreatedOn` datetime NOT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=551 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- Create the stored procedure
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS `GetNewCustomersByMonth`()
BEGIN
    SELECT 
        COUNT(Customer.Naam) AS newCustomersThisMonth,
        YEAR(Appointment.Date) AS year,
        MONTH(Appointment.Date) AS month
    FROM Appointment
    LEFT JOIN Customer ON Customer.Id = Appointment.CustomerId
    WHERE Appointment.Date = (
        SELECT MIN(a2.Date)
        FROM Appointment a2
        WHERE a2.CustomerId = Customer.Id
    )
    GROUP BY YEAR(Appointment.Date), MONTH(Appointment.Date)
    ORDER BY year ASC, month ASC;
END//
DELIMITER ;

-- Enable foreign key checks and add constraints
SET FOREIGN_KEY_CHECKS = 1;

-- Add foreign key constraints
ALTER TABLE `Statics_AppointmentStatus`
  DROP FOREIGN KEY IF EXISTS `Statics_AppointmentStatus_ibfk_1`,
  ADD CONSTRAINT `Statics_AppointmentStatus_ibfk_1` 
  FOREIGN KEY (`Color`) REFERENCES `Statics_CustomColor` (`Color`);

ALTER TABLE `Dog`
  DROP FOREIGN KEY IF EXISTS `Dog_ibfk_1`,
  DROP FOREIGN KEY IF EXISTS `Dog_ibfk_2`,
  ADD CONSTRAINT `Dog_ibfk_1` 
  FOREIGN KEY (`CustomerId`) REFERENCES `Customer` (`Id`) ON DELETE CASCADE,
  ADD CONSTRAINT `Dog_ibfk_2` 
  FOREIGN KEY (`DogSizeId`) REFERENCES `Statics_DogSize` (`Id`);

ALTER TABLE `Appointment`
  DROP FOREIGN KEY IF EXISTS `Appointment_ibfk_1`,
  DROP FOREIGN KEY IF EXISTS `Appointment_ibfk_2`,
  DROP FOREIGN KEY IF EXISTS `Appointment_ibfk_3`,
  ADD CONSTRAINT `Appointment_ibfk_1` 
  FOREIGN KEY (`CustomerId`) REFERENCES `Customer` (`Id`),
  ADD CONSTRAINT `Appointment_ibfk_2` 
  FOREIGN KEY (`AppointmentStatusId`) REFERENCES `Statics_AppointmentStatus` (`Id`),
  ADD CONSTRAINT `Appointment_ibfk_3` 
  FOREIGN KEY (`AppointmentTypeId`) REFERENCES `Statics_AppointmentType` (`Id`);

ALTER TABLE `AppointmentDog`
  DROP FOREIGN KEY IF EXISTS `AppointmentDog_ibfk_1`,
  DROP FOREIGN KEY IF EXISTS `AppointmentDog_ibfk_2`,
  ADD CONSTRAINT `AppointmentDog_ibfk_1` 
  FOREIGN KEY (`AppointmentId`) REFERENCES `Appointment` (`Id`) ON DELETE CASCADE,
  ADD CONSTRAINT `AppointmentDog_ibfk_2` 
  FOREIGN KEY (`DogId`) REFERENCES `Dog` (`Id`);

ALTER TABLE `Invoice`
  DROP FOREIGN KEY IF EXISTS `Invoice_ibfk_1`,
  DROP FOREIGN KEY IF EXISTS `Invoice_ibfk_2`,
  DROP FOREIGN KEY IF EXISTS `Invoice_ibfk_3`,
  ADD CONSTRAINT `Invoice_ibfk_1` 
  FOREIGN KEY (`AppointmentId`) REFERENCES `Appointment` (`Id`),
  ADD CONSTRAINT `Invoice_ibfk_2` 
  FOREIGN KEY (`CustomCustomerId`) REFERENCES `Customer` (`Id`),
  ADD CONSTRAINT `Invoice_ibfk_3` 
  FOREIGN KEY (`PaymentTypeId`) REFERENCES `Statics_PaymentType` (`Id`);

ALTER TABLE `AdditionalHour`
  DROP FOREIGN KEY IF EXISTS `AdditionalHour_ibfk_1`,
  DROP FOREIGN KEY IF EXISTS `AdditionalHour_ibfk_2`,
  ADD CONSTRAINT `AdditionalHour_ibfk_1` 
  FOREIGN KEY (`InvoiceId`) REFERENCES `Invoice` (`Id`),
  ADD CONSTRAINT `AdditionalHour_ibfk_2` 
  FOREIGN KEY (`HourTypeId`) REFERENCES `Statics_HourType` (`Id`);

ALTER TABLE `DogDogbreed`
  DROP FOREIGN KEY IF EXISTS `DogDogbreed_ibfk_1`,
  DROP FOREIGN KEY IF EXISTS `DogDogbreed_ibfk_2`,
  ADD CONSTRAINT `DogDogbreed_ibfk_1` 
  FOREIGN KEY (`DogId`) REFERENCES `Dog` (`Id`) ON DELETE CASCADE,
  ADD CONSTRAINT `DogDogbreed_ibfk_2` 
  FOREIGN KEY (`DogBreedId`) REFERENCES `Dogbreed` (`Id`);

ALTER TABLE `DogPicture`
  DROP FOREIGN KEY IF EXISTS `DogPicture_ibfk_1`,
  DROP FOREIGN KEY IF EXISTS `DogPicture_ibfk_2`,
  ADD CONSTRAINT `DogPicture_ibfk_1` 
  FOREIGN KEY (`DogId`) REFERENCES `Dog` (`Id`) ON DELETE CASCADE,
  ADD CONSTRAINT `DogPicture_ibfk_2` 
  FOREIGN KEY (`AppointmentId`) REFERENCES `Appointment` (`Id`);

ALTER TABLE `InvoiceLine`
  DROP FOREIGN KEY IF EXISTS `InvoiceLine_ibfk_1`,
  DROP FOREIGN KEY IF EXISTS `InvoiceLine_ibfk_2`,
  DROP FOREIGN KEY IF EXISTS `InvoiceLine_ibfk_3`,
  ADD CONSTRAINT `InvoiceLine_ibfk_1` 
  FOREIGN KEY (`InvoiceId`) REFERENCES `Invoice` (`Id`) ON DELETE CASCADE,
  ADD CONSTRAINT `InvoiceLine_ibfk_2` 
  FOREIGN KEY (`BTWpercentageId`) REFERENCES `Statics_BTWpercentage` (`Id`),
  ADD CONSTRAINT `InvoiceLine_ibfk_3` 
  FOREIGN KEY (`InvoiceCategoryId`) REFERENCES `Statics_InvoiceCategory` (`Id`);

ALTER TABLE `ServiceAppointmentDog`
  DROP FOREIGN KEY IF EXISTS `ServiceAppointmentDog_ibfk_1`,
  DROP FOREIGN KEY IF EXISTS `ServiceAppointmentDog_ibfk_2`,
  ADD CONSTRAINT `ServiceAppointmentDog_ibfk_1` 
  FOREIGN KEY (`AppointmentDogId`) REFERENCES `AppointmentDog` (`Id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ServiceAppointmentDog_ibfk_2` 
  FOREIGN KEY (`ServiceId`) REFERENCES `Service` (`Id`);

ALTER TABLE `DigiBTW_Expenses`
  DROP FOREIGN KEY IF EXISTS `CustomerId`,
  ADD CONSTRAINT `CustomerId` 
  FOREIGN KEY (`CustomerId`) REFERENCES `Customer` (`Id`);

-- Insert initial static data
INSERT IGNORE INTO `Statics_CustomColor` (`Color`, `Order`, `Hex`, `Legend`) VALUES
('Blue', 1, '#0000FF', 'Blue'),
('Green', 2, '#00FF00', 'Green'),
('Red', 3, '#FF0000', 'Red');

INSERT IGNORE INTO `Statics_AppointmentStatus` (`Id`, `Label`, `Order`, `Is_Active`, `Color`) VALUES
('SCHEDULED', 'Scheduled', 1, 1, 'Blue'),
('COMPLETED', 'Completed', 2, 1, 'Green'),
('CANCELLED', 'Cancelled', 3, 1, 'Red');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */; 