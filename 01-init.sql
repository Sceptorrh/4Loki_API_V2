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
  `Color` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `Color` (`Color`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Statics_AppointmentType` (
  `Id` varchar(50) NOT NULL,
  `Label` varchar(255) DEFAULT NULL,
  `Order` int(11) DEFAULT NULL,
  `LabelDutch` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Statics_BTWpercentage` (
  `Id` varchar(50) NOT NULL,
  `Label` varchar(255) DEFAULT NULL,
  `Amount` int(11) DEFAULT NULL,
  `Order` int(11) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Statics_DogSize` (
  `Id` varchar(50) NOT NULL,
  `Label` varchar(255) DEFAULT NULL,
  `Order` int(11) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Statics_HourType` (
  `Id` varchar(50) NOT NULL,
  `Label` varchar(255) DEFAULT NULL,
  `Order` int(11) DEFAULT NULL,
  `DefaultText` text DEFAULT NULL,
  `IsExport` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Statics_ImportExportType` (
  `Id` varchar(50) NOT NULL,
  `Label` varchar(255) DEFAULT NULL,
  `Order` int(11) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Statics_PaymentType` (
  `Id` varchar(50) NOT NULL,
  `Label` varchar(255) DEFAULT NULL,
  `Order` int(11) DEFAULT NULL,
  `LabelDutch` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Statics_TravelTimeType` (
  `Id` varchar(50) NOT NULL,
  `Label` varchar(255) DEFAULT NULL,
  `Order` int(11) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Statics_Service` (
  `Id` varchar(50) NOT NULL,
  `Name` varchar(255) DEFAULT NULL,
  `StandardPrice` decimal(10,2) DEFAULT NULL,
  `IsPriceAllowed` tinyint(1) DEFAULT NULL,
  `StandardDuration` int(11) DEFAULT NULL,
  `Order` int(11) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Statics_Dogbreed` (
  `Id` varchar(50) NOT NULL,
  `Name` varchar(255) DEFAULT NULL,
  `Order` int(11) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  `AppointmentTypeId` varchar(50) DEFAULT NULL,
  `Note` text DEFAULT NULL,
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
  `CustomCustomerId` int(11) DEFAULT NULL,
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
  `InvoiceId` int(11) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `InvoiceId` (`InvoiceId`),
  KEY `HourTypeId` (`HourTypeId`)
) ENGINE=InnoDB AUTO_INCREMENT=443 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `DogDogbreed` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `DogId` int(11) NOT NULL,
  `DogBreedId` varchar(50) NOT NULL,
  PRIMARY KEY (`Id`),
  KEY `DogBreedId` (`DogBreedId`),
  KEY `DogId` (`DogId`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ExportLog` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `IssuedOn` datetime DEFAULT NULL,
  `ForMonthDate` date DEFAULT NULL,
  `IsSuccesfull` tinyint(1) DEFAULT NULL,
  `IsDummy` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `InvoiceLine` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `InvoiceId` int(11) DEFAULT NULL,
  `Omschrijving` text DEFAULT NULL,
  `Aantal` int(11) DEFAULT NULL,
  `BTWpercentageId` varchar(50) DEFAULT NULL,
  `Bedragexcl_btw` decimal(10,2) DEFAULT NULL,
  `Categorie` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `InvoiceId` (`InvoiceId`),
  KEY `BTWpercentageId` (`BTWpercentageId`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ServiceAppointmentDog` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `ServiceId` varchar(50) NOT NULL,
  `AppointmentDogId` int(11) NOT NULL,
  `Price` DECIMAL(10,2) DEFAULT 0.00,
  PRIMARY KEY (`Id`),
  KEY `ServiceId` (`ServiceId`),
  KEY `AppointmentDogId` (`AppointmentDogId`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `TravelTime` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `AppointmentId` int(11) DEFAULT NULL,
  `TravelTimeTypeId` varchar(50) DEFAULT NULL,
  `Duration` int(11) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `AppointmentId` (`AppointmentId`),
  KEY `TravelTimeTypeId` (`TravelTimeTypeId`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert static data

INSERT INTO `Statics_Dogbreed` (`Id`, `Name`, `Order`) VALUES
    ('labrador', 'Labrador Retriever', 1),
    ('german_shepherd', 'German Shepherd', 2),
    ('golden_retriever', 'Golden Retriever', 3),
    ('french_bulldog', 'French Bulldog', 4),
    ('bulldog', 'Bulldog', 5),
    ('poodle', 'Poodle', 6),
    ('beagle', 'Beagle', 7),
    ('rottweiler', 'Rottweiler', 8),
    ('dachshund', 'Dachshund', 9),
    ('yorkshire_terrier', 'Yorkshire Terrier', 10),
    ('boxer', 'Boxer', 11),
    ('chihuahua', 'Chihuahua', 12),
    ('husky', 'Siberian Husky', 13),
    ('corgi', 'Pembroke Welsh Corgi', 14),
    ('great_dane', 'Great Dane', 15);

INSERT INTO `Statics_Service` (`Id`, `Name`, `StandardPrice`, `IsPriceAllowed`, `StandardDuration`, `Order`) VALUES 
    ('trimmen', 'Trimmen', 60.0, 0, 120, 1),
    ('nagels_knippen', 'Nagels knippen', 15.0, 0, 30, 2),
    ('puppy_beurt', 'Puppy beurt', 0.0, 1, 0, 3);

INSERT INTO `Statics_AppointmentStatus` (`Id`, `Label`, `Order`, `Color`) VALUES
    ('Can', 'Geannuleerd', 3, 'Cancelled'),
    ('Exp', 'Geexporteerd', 7, 'Exported'),
    ('Inv', 'Gefactureerd', 5, 'Invoiced'),
    ('NotExp', 'NotExported', 8, 'NotExported'),
    ('Pln', 'Gepland', 2, 'Planned');

INSERT INTO `Statics_AppointmentType` (`Id`, `Label`, `Order`, `LabelDutch`) VALUES
    ('DogWalking', 'DogWalking', 2, 'Uitlaatservice'),
    ('Absent', 'Absent', 3, 'Afwezigheid'),
    ('Grooming', 'Grooming', 1, 'Trimmen');

INSERT INTO `Statics_BTWpercentage` (`Id`, `Label`, `Amount`, `Order`) VALUES
    ('21', '21%', 21, 1),
    ('0', '0%', 0, 2);

INSERT INTO `Statics_CustomColor` (`Color`, `Order`, `Hex`, `Legend`) VALUES
    ('Cancelled', 4, '#a80808', 'Geannuleerd'),
    ('Exported', 3, '#74ed86', 'Geexporteerd'),
    ('Invoiced', 2, '#4973de', 'Gefactureerd'),
    ('NotExported', 6, '#b5cc8d', 'Niet geexporteerd'),
    ('OtherHours', 5, '#57c2bb', 'Andere uren'),
    ('Planned', 1, '#a9abb0', 'Geplanned');

INSERT INTO `Statics_DogSize` (`Id`, `Label`, `Order`) VALUES
    ('L', 'Large', 3),
    ('M', 'Middle', 2),
    ('S', 'Small', 1),
    ('X', 'ExtraLarge', 4);

INSERT INTO `Statics_HourType` (`Id`, `Label`, `Order`, `DefaultText`, `IsExport`) VALUES
    ('Adm', 'Administratie', 1, 'Administratie', 1),
    ('App', 'Afspraak', 10, NULL, 0),
    ('Cur', 'Cursus', 3, 'Cursus gevolgd', 1),
    ('Fac', 'Factuur', 5, NULL, 1),
    ('Ink', 'Inkopen', 2, 'Inkopen gedaan', 1),
    ('Reis', 'Reistijd', 6, 'Reistijd', 1),
    ('sch', 'Schoonmaken', 4, 'Trimsalon schoongemaakt', 1),
    ('Stage', 'Stage trimsalon', 7, 'Stage trimsalon', 1),
    ('Vak', 'Vakantie', 8, 'Vakantie', 0),
    ('Zk', 'Ziek', 9, 'Ziek', 0);

INSERT INTO `Statics_ImportExportType` (`Id`, `Label`, `Order`) VALUES
    ('Hour', 'Hour', 1),
    ('Invoice', 'Invoice', 2),
    ('Purchase', 'Purchase', 3),
    ('Relation', 'Relation', 4);

INSERT INTO `Statics_PaymentType` (`Id`, `Label`, `Order`, `LabelDutch`) VALUES
    ('BT', 'Bank', 3, NULL),
    ('Csh', 'Cash', 2, NULL);

INSERT INTO `Statics_TravelTimeType` (`Id`, `Label`, `Order`) VALUES
    ('HomeWork', 'HomeWork', 1),
    ('WorkHome', 'WorkHome', 2);

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Add foreign key constraints
ALTER TABLE `Statics_AppointmentStatus` ADD CONSTRAINT `Statics_AppointmentStatus_ibfk_1` FOREIGN KEY (`Color`) REFERENCES `Statics_CustomColor` (`Color`);
ALTER TABLE `Dog` ADD CONSTRAINT `Dog_ibfk_1` FOREIGN KEY (`DogSizeId`) REFERENCES `Statics_DogSize` (`Id`);
ALTER TABLE `Dog` ADD CONSTRAINT `Dog_ibfk_2` FOREIGN KEY (`CustomerId`) REFERENCES `Customer` (`Id`);
ALTER TABLE `Appointment` ADD CONSTRAINT `Appointment_ibfk_1` FOREIGN KEY (`CustomerId`) REFERENCES `Customer` (`Id`);
ALTER TABLE `Appointment` ADD CONSTRAINT `Appointment_ibfk_2` FOREIGN KEY (`AppointmentStatusId`) REFERENCES `Statics_AppointmentStatus` (`Id`);
ALTER TABLE `Appointment` ADD CONSTRAINT `Appointment_ibfk_3` FOREIGN KEY (`AppointmentTypeId`) REFERENCES `Statics_AppointmentType` (`Id`);
ALTER TABLE `AppointmentDog` ADD CONSTRAINT `AppointmentDog_ibfk_1` FOREIGN KEY (`DogId`) REFERENCES `Dog` (`Id`);
ALTER TABLE `AppointmentDog` ADD CONSTRAINT `AppointmentDog_ibfk_2` FOREIGN KEY (`AppointmentId`) REFERENCES `Appointment` (`Id`);
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_ibfk_1` FOREIGN KEY (`AppointmentId`) REFERENCES `Appointment` (`Id`);
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_ibfk_2` FOREIGN KEY (`CustomCustomerId`) REFERENCES `Customer` (`Id`);
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_ibfk_3` FOREIGN KEY (`PaymentTypeId`) REFERENCES `Statics_PaymentType` (`Id`);
ALTER TABLE `AdditionalHour` ADD CONSTRAINT `AdditionalHour_ibfk_1` FOREIGN KEY (`InvoiceId`) REFERENCES `Invoice` (`Id`);
ALTER TABLE `AdditionalHour` ADD CONSTRAINT `AdditionalHour_ibfk_2` FOREIGN KEY (`HourTypeId`) REFERENCES `Statics_HourType` (`Id`);
ALTER TABLE `DogDogbreed` ADD CONSTRAINT `DogDogbreed_ibfk_1` FOREIGN KEY (`DogBreedId`) REFERENCES `Statics_Dogbreed` (`Id`);
ALTER TABLE `DogDogbreed` ADD CONSTRAINT `DogDogbreed_ibfk_2` FOREIGN KEY (`DogId`) REFERENCES `Dog` (`Id`) ON DELETE CASCADE;
ALTER TABLE `InvoiceLine` ADD CONSTRAINT `InvoiceLine_ibfk_1` FOREIGN KEY (`InvoiceId`) REFERENCES `Invoice` (`Id`);
ALTER TABLE `InvoiceLine` ADD CONSTRAINT `InvoiceLine_ibfk_2` FOREIGN KEY (`BTWpercentageId`) REFERENCES `Statics_BTWpercentage` (`Id`);
ALTER TABLE `ServiceAppointmentDog` ADD CONSTRAINT `ServiceAppointmentDog_ibfk_1` FOREIGN KEY (`ServiceId`) REFERENCES `Statics_Service` (`Id`);
ALTER TABLE `ServiceAppointmentDog` ADD CONSTRAINT `ServiceAppointmentDog_ibfk_2` FOREIGN KEY (`AppointmentDogId`) REFERENCES `AppointmentDog` (`Id`);
ALTER TABLE `TravelTime` ADD CONSTRAINT `TravelTime_ibfk_1` FOREIGN KEY (`AppointmentId`) REFERENCES `Appointment` (`Id`);
ALTER TABLE `TravelTime` ADD CONSTRAINT `TravelTime_ibfk_2` FOREIGN KEY (`TravelTimeTypeId`) REFERENCES `Statics_TravelTimeType` (`Id`);

-- Restore original settings
SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET SQL_NOTES=@OLD_SQL_NOTES;
SET TIME_ZONE=@OLD_TIME_ZONE;
SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT;