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
  `Notities` text DEFAULT NULL,
  `IsExported` tinyint(1) DEFAULT NULL,
  `IsAllowContactShare` varchar(10) DEFAULT NULL,
  `CreatedOn` datetime DEFAULT CURRENT_TIMESTAMP,
  `UpdatedOn` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `customer_naam_unique` (`Naam`),
  UNIQUE KEY `customer_telefoonnummer_unique` (`Telefoonnummer`),
  UNIQUE KEY `customer_contactpersoon_unique` (`Contactpersoon`)
) ENGINE=InnoDB AUTO_INCREMENT=256 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Dog` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `CustomerId` int(11) DEFAULT NULL,
  `Name` varchar(255) DEFAULT NULL,
  `Birthday` date DEFAULT NULL,
  `Allergies` text DEFAULT NULL,
  `ServiceNote` text DEFAULT NULL,
  `DogSizeId` varchar(50) DEFAULT NULL,
  `CreatedOn` datetime DEFAULT CURRENT_TIMESTAMP,
  `UpdatedOn` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
  `Note` text DEFAULT NULL,
  `SerialNumber` int(11) DEFAULT NULL,
  `IsPaidInCash` tinyint(1) DEFAULT 0,
  `CreatedOn` datetime DEFAULT CURRENT_TIMESTAMP,
  `UpdatedOn` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`),
  KEY `CustomerId` (`CustomerId`),
  KEY `AppointmentStatusId` (`AppointmentStatusId`),
  KEY `Id` (`Id`),
  KEY `Date` (`Date`)
) ENGINE=InnoDB AUTO_INCREMENT=882 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `AppointmentDog` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `AppointmentId` int(11) NOT NULL,
  `DogId` int(11) NOT NULL,
  `Note` text DEFAULT NULL,
  `CreatedOn` datetime DEFAULT CURRENT_TIMESTAMP,
  `UpdatedOn` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`),
  KEY `DogId` (`DogId`),
  KEY `AppointmentId` (`AppointmentId`)
) ENGINE=InnoDB AUTO_INCREMENT=2223 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `AdditionalHour` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `HourTypeId` varchar(20) DEFAULT NULL,
  `Duration` int(11) DEFAULT NULL,
  `Date` date DEFAULT NULL,
  `Description` text DEFAULT NULL,
  `IsExported` tinyint(1) DEFAULT NULL,
  `CreatedOn` datetime DEFAULT CURRENT_TIMESTAMP,
  `UpdatedOn` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`),
  KEY `HourTypeId` (`HourTypeId`)
) ENGINE=InnoDB AUTO_INCREMENT=443 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `DogDogbreed` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `DogId` int(11) NOT NULL,
  `DogBreedId` varchar(50) NOT NULL,
  `CreatedOn` datetime DEFAULT CURRENT_TIMESTAMP,
  `UpdatedOn` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
  `CreatedOn` datetime DEFAULT CURRENT_TIMESTAMP,
  `UpdatedOn` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ServiceAppointmentDog` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `ServiceId` varchar(50) NOT NULL,
  `AppointmentDogId` int(11) NOT NULL,
  `Price` DECIMAL(10,2) DEFAULT 0.00,
  `CreatedOn` datetime DEFAULT CURRENT_TIMESTAMP,
  `UpdatedOn` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`),
  KEY `ServiceId` (`ServiceId`),
  KEY `AppointmentDogId` (`AppointmentDogId`)
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

-- Add foreign key constraints
ALTER TABLE `Statics_AppointmentStatus` ADD CONSTRAINT `Statics_AppointmentStatus_ibfk_1` FOREIGN KEY (`Color`) REFERENCES `Statics_CustomColor` (`Color`);
ALTER TABLE `Dog` ADD CONSTRAINT `Dog_ibfk_1` FOREIGN KEY (`DogSizeId`) REFERENCES `Statics_DogSize` (`Id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Dog` ADD CONSTRAINT `Dog_ibfk_2` FOREIGN KEY (`CustomerId`) REFERENCES `Customer` (`Id`);
ALTER TABLE `Appointment` ADD CONSTRAINT `Appointment_ibfk_1` FOREIGN KEY (`CustomerId`) REFERENCES `Customer` (`Id`);
ALTER TABLE `Appointment` ADD CONSTRAINT `Appointment_ibfk_2` FOREIGN KEY (`AppointmentStatusId`) REFERENCES `Statics_AppointmentStatus` (`Id`);
ALTER TABLE `AppointmentDog` ADD CONSTRAINT `AppointmentDog_ibfk_1` FOREIGN KEY (`DogId`) REFERENCES `Dog` (`Id`);
ALTER TABLE `AppointmentDog` ADD CONSTRAINT `AppointmentDog_ibfk_2` FOREIGN KEY (`AppointmentId`) REFERENCES `Appointment` (`Id`);
ALTER TABLE `AdditionalHour` ADD CONSTRAINT `AdditionalHour_ibfk_2` FOREIGN KEY (`HourTypeId`) REFERENCES `Statics_HourType` (`Id`);
ALTER TABLE `DogDogbreed` ADD CONSTRAINT `DogDogbreed_ibfk_1` FOREIGN KEY (`DogBreedId`) REFERENCES `Statics_Dogbreed` (`Id`);
ALTER TABLE `DogDogbreed` ADD CONSTRAINT `DogDogbreed_ibfk_2` FOREIGN KEY (`DogId`) REFERENCES `Dog` (`Id`) ON DELETE CASCADE;
ALTER TABLE `ServiceAppointmentDog` ADD CONSTRAINT `ServiceAppointmentDog_ibfk_1` FOREIGN KEY (`ServiceId`) REFERENCES `Statics_Service` (`Id`);
ALTER TABLE `ServiceAppointmentDog` ADD CONSTRAINT `ServiceAppointmentDog_ibfk_2` FOREIGN KEY (`AppointmentDogId`) REFERENCES `AppointmentDog` (`Id`);

SET FOREIGN_KEY_CHECKS = 1;