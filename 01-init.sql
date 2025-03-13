/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS `4Loki_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `4Loki_db`;

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
  KEY `CustomerId` (`CustomerId`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  KEY `Date` (`Date`)
) ENGINE=InnoDB AUTO_INCREMENT=882 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `AppointmentDog` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `AppointmentId` int(11) NOT NULL,
  `DogId` int(11) NOT NULL,
  `Note` text DEFAULT NULL,
  `OwnerId` int(11) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `DogId` (`DogId`),
  KEY `AppointmentId` (`AppointmentId`)
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
  KEY `PaymentTypeId` (`PaymentTypeId`)
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
  KEY `HourTypeId` (`HourTypeId`)
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
  KEY `DogId` (`DogId`)
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
  KEY `DogId` (`DogId`)
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
  KEY `InvoiceId` (`InvoiceId`)
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
  KEY `AppointmentDogId` (`AppointmentDogId`)
) ENGINE=InnoDB AUTO_INCREMENT=1951 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `TravelTime` (
  `Type` TEXT NOT NULL,
  `DateTime` DATETIME NOT NULL,
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `Value` int(11) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert static data
INSERT INTO `Statics_AppointmentStatus` (`Id`, `Label`, `Order`, `Is_Active`, `Color`) VALUES
    ('Can', 'Geannuleerd', 3, 1, 'Cancelled'),
    ('Exp', 'Geexporteerd', 7, 1, 'Exported'),
    ('Inv', 'Gefactureerd', 5, 1, 'Invoiced'),
    ('NotExp', 'NotExported', 8, 1, 'NotExported'),
    ('Pln', 'Gepland', 2, 1, 'Planned');

INSERT INTO `Statics_AppointmentType` (`Id`, `Label`, `Order`, `Is_Active`, `LabelDutch`) VALUES
    (1, 'DogWalking', 2, 1, 'Uitlaatservice'),
    (2, 'Absent', 3, 1, 'Afwezigheid'),
    (3, 'Grooming', 1, 1, 'Trimmen');

INSERT INTO `Statics_BTWpercentage` (`Id`, `Label`, `Amount`) VALUES
    (1, '21%', 21),
    (2, '0%', 0);

INSERT INTO `Statics_CustomColor` (`Color`, `Order`, `Hex`, `Legend`) VALUES
    ('Cancelled', 4, '#a80808', 'Geannuleerd'),
    ('Exported', 3, '#74ed86', 'Geexporteerd'),
    ('Invoiced', 2, '#4973de', 'Gefactureerd'),
    ('NotExported', 6, '#b5cc8d', 'Niet geexporteerd'),
    ('OtherHours', 5, '#57c2bb', 'Andere uren'),
    ('Planned', 1, '#a9abb0', 'Geplanned');

INSERT INTO `Statics_DogSize` (`Id`, `Label`, `Order`, `Is_Active`) VALUES
    ('L', 'Large', 3, 1),
    ('M', 'Middle', 2, 1),
    ('S', 'Small', 1, 1),
    ('X', 'ExtraLarge', 4, 1);

INSERT INTO `Statics_HourType` (`Id`, `Label`, `Order`, `Is_Active`, `DefaultText`, `IsExport`) VALUES
    ('Adm', 'Administratie', 1, 1, 'Administratie', 1),
    ('App', 'Afspraak', 10, 1, NULL, 0),
    ('Cur', 'Cursus', 3, 1, 'Cursus gevolgd', 1),
    ('Fac', 'Factuur', 5, 1, NULL, 1),
    ('Ink', 'Inkopen', 2, 1, 'Inkopen gedaan', 1),
    ('Reis', 'Reistijd', 6, 1, 'Reistijd', 1),
    ('sch', 'Schoonmaken', 4, 1, 'Trimsalon schoongemaakt', 1),
    ('Stage', 'Stage trimsalon', 7, 1, 'Stage trimsalon', 1),
    ('Vak', 'Vakantie', 8, 1, 'Vakantie', 0),
    ('Zk', 'Ziek', 9, 1, 'Ziek', 0);

INSERT INTO `Statics_ImportExportType` (`Id`, `Label`) VALUES
    ('Hour', 'Hour'),
    ('Invoice', 'Invoice'),
    ('Purchase', 'Purchase'),
    ('Relation', 'Relation');

INSERT INTO `Statics_InvoiceCategory` (`Id`, `Label`, `Order`, `Is_Active`, `Knab`) VALUES
    (1, 'Paarden', 3, 1, 'Omzet Paarden'),
    (2, 'Trimsalon', 1, 1, 'Omzet Trimsalon'),
    (3, 'Chuck & Charlie', 2, 1, 'Omzet Chuck&Charlie');

INSERT INTO `Statics_PaymentType` (`Id`, `Label`, `Order`, `Is_Active`, `LabelDutch`) VALUES
    ('BT', 'Bank', 3, 1, NULL),
    ('Csh', 'Cash', 2, 1, NULL);

INSERT INTO `Statics_TravelTimeType` (`Id`, `Label`, `Order`, `Is_Active`) VALUES
    (1, 'HomeWork', 1, 1),
    (2, 'WorkHome', 2, 1);

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
  KEY `CustomerId` (`CustomerId`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  KEY `Date` (`Date`)
) ENGINE=InnoDB AUTO_INCREMENT=882 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `AppointmentDog` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `AppointmentId` int(11) NOT NULL,
  `DogId` int(11) NOT NULL,
  `Note` text DEFAULT NULL,
  `OwnerId` int(11) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `DogId` (`DogId`),
  KEY `AppointmentId` (`AppointmentId`)
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
  KEY `PaymentTypeId` (`PaymentTypeId`)
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
  KEY `HourTypeId` (`HourTypeId`)
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
  KEY `DogId` (`DogId`)
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
  KEY `DogId` (`DogId`)
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
  KEY `InvoiceId` (`InvoiceId`)
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
  KEY `AppointmentDogId` (`AppointmentDogId`)
) ENGINE=InnoDB AUTO_INCREMENT=1951 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `TravelTime` (
  `Type` TEXT NOT NULL,
  `DateTime` DATETIME NOT NULL,
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `Value` int(11) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */; 