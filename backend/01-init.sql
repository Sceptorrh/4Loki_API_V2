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
  `UpUntilDate` date DEFAULT NULL,
  `IsSuccesfull` tinyint(1) DEFAULT NULL,
  `IsDummy` tinyint(1) DEFAULT NULL,
  `FileName` varchar(255) DEFAULT NULL,
  `Notes` text DEFAULT NULL,
  `IsReverted` tinyint(1) DEFAULT 0,
  `RevertedOn` datetime DEFAULT NULL,
  `RevertedBy` varchar(100) DEFAULT NULL,
  `RevertReason` text DEFAULT NULL,
  `CreatedOn` datetime DEFAULT CURRENT_TIMESTAMP,
  `UpdatedOn` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ExportLogAppointment` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `ExportLogId` int(11) NOT NULL,
  `AppointmentId` int(11) NOT NULL,
  `PreviousStatusId` varchar(50) DEFAULT NULL,
  `IsReverted` tinyint(1) DEFAULT 0,
  `RevertedOn` datetime DEFAULT NULL,
  `CreatedOn` datetime DEFAULT CURRENT_TIMESTAMP,
  `UpdatedOn` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`),
  KEY `ExportLogId` (`ExportLogId`),
  KEY `AppointmentId` (`AppointmentId`),
  KEY `PreviousStatusId` (`PreviousStatusId`),
  CONSTRAINT `ExportLogAppointment_ibfk_1` FOREIGN KEY (`ExportLogId`) REFERENCES `ExportLog` (`Id`) ON DELETE CASCADE,
  CONSTRAINT `ExportLogAppointment_ibfk_2` FOREIGN KEY (`AppointmentId`) REFERENCES `Appointment` (`Id`) ON DELETE CASCADE,
  CONSTRAINT `ExportLogAppointment_ibfk_3` FOREIGN KEY (`PreviousStatusId`) REFERENCES `Statics_AppointmentStatus` (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
    ('affenpinscher', 'Affenpinscher', 1),
    ('afghaanse_windhond', 'Afghaanse Windhond', 2),
    ('aidi', 'Aidi', 3),
    ('airedale_terrier', 'Airedale Terrier', 4),
    ('akita', 'Akita', 5),
    ('alaska_malamute', 'Alaska Malamute', 6),
    ('alpenlandische_dachsbracke', 'Alpenländische Dachsbracke', 7),
    ('american_akita', 'American Akita', 8),
    ('american_foxhound', 'American Foxhound', 9),
    ('american_staffordshire_terrier', 'American Staffordshire Terrier', 10),
    ('amerikaanse_cocker_spaniel', 'Amerikaanse Cocker Spaniel', 11),
    ('amerikaanse_water_spaniel', 'Amerikaanse Water Spaniel', 12),
    ('anglo_francais_de_petite_venerie', 'Anglo-Français de Petite Vénerie', 13),
    ('appenzeller_sennenhond', 'Appenzeller Sennenhond', 14),
    ('argentijnse_dog', 'Argentijnse Dog', 15),
    ('ariegois', 'Ariegois', 16),
    ('australian_cattle_dog', 'Australian Cattle Dog', 17),
    ('australian_kelpie', 'Australian Kelpie', 18),
    ('australian_shepherd', 'Australian Shepherd', 19),
    ('australian_silky_terrier', 'Australian Silky Terrier', 20),
    ('australian_stumpy_tail_cattle_dog', 'Australian Stumpy Tail Cattle Dog', 21),
    ('australian_terrier', 'Australian Terrier', 22),
    ('azawakh', 'Azawakh', 23),
    ('barbet', 'Barbet', 24),
    ('barsoi', 'Barsoi', 25),
    ('basenji', 'Basenji', 26),
    ('basset_artesien_normand', 'Basset Artésien Normand', 27),
    ('basset_bleu_de_gascogne', 'Basset Bleu de Gascogne', 28),
    ('basset_fauve_de_bretagne', 'Basset Fauve de Bretagne', 29),
    ('basset_hound', 'Basset Hound', 30),
    ('bayerischer_gebirgsschweisshund', 'Bayerischer Gebirgsschweisshund', 31),
    ('beagle', 'Beagle', 32),
    ('beagle_harrier', 'Beagle Harrier', 33),
    ('bearded_collie', 'Bearded Collie', 34),
    ('beauceron', 'Beauceron', 35),
    ('bedlington_terrier', 'Bedlington Terrier', 36),
    ('belgische_herdershond_groenendaeler', 'Belgische Herdershond, Groenendaeler', 37),
    ('belgische_herdershond_laekense', 'Belgische Herdershond, Laekense', 38),
    ('belgische_herdershond_mechelse', 'Belgische Herdershond, Mechelse', 39),
    ('belgische_herdershond_tervuerense', 'Belgische Herdershond, Tervuerense', 40),
    ('bergamasco', 'Bergamasco', 41),
    ('berghond_van_de_maremmen', 'Berghond van de Maremmen', 42),
    ('berner_laufhund', 'Berner Laufhund', 43),
    ('berner_niederlaufhund', 'Berner Niederlaufhund', 44),
    ('berner_sennenhond', 'Berner Sennenhond', 45),
    ('bichon_frise', 'Bichon Frise', 46),
    ('billy', 'Billy', 47),
    ('black_and_tan_coonhound', 'Black and Tan Coonhound', 48),
    ('bloedhond', 'Bloedhond', 49),
    ('bolognezer', 'Bolognezer', 50),
    ('bordeaux_dog', 'Bordeaux Dog', 51),
    ('border_collie', 'Border Collie', 52),
    ('border_terrier', 'Border Terrier', 53),
    ('bosnian_ostrodlaki_gonic_barak', 'Bosnian Ostrodlaki Gonic Barak', 54),
    ('boston_terrier', 'Boston Terrier', 55),
    ('bouvier_des_ardennes', 'Bouvier des Ardennes', 56),
    ('bouvier_des_flandres', 'Bouvier des Flandres', 57),
    ('boxer', 'Boxer', 58),
    ('bracco_italiano', 'Bracco Italiano', 59),
    ('brandlbracke', 'Brandlbracke', 60),
    ('braque_dauvergne', 'Braque d\'Auvergne', 61),
    ('braque_de_lariege', 'Braque de l\'Ariège', 62),
    ('braque_du_bourbonnais', 'Braque du Bourbonnais', 63),
    ('braque_francais_type_gascogne', 'Braque Français, type Gascogne', 64),
    ('braque_francais_type_pyrenees', 'Braque Français, type Pyrenees (klein)', 65),
    ('braque_saint_germain', 'Braque Saint Germain', 66),
    ('braziliaanse_terrier', 'Braziliaanse Terrier', 67),
    ('briard', 'Briard', 68),
    ('briquet_griffon_vendeen', 'Briquet Griffon Vendéen', 69),
    ('broholmer', 'Broholmer', 70),
    ('bull_terrier', 'Bull Terrier', 71),
    ('bullmastiff', 'Bullmastiff', 72),
    ('cairn_terrier', 'Cairn Terrier', 73),
    ('canaanhond', 'Canaanhond', 74),
    ('cane_corso', 'Cane Corso', 75),
    ('cao_da_serra_da_estrela_korthaar', 'Cão da Serra da Estrela, korthaar', 76),
    ('cao_da_serra_da_estrela_langhaar', 'Cão da Serra da Estrela, langhaar', 77),
    ('cao_da_serra_de_aires', 'Cão da Serra de Aires', 78),
    ('cao_de_agua_portugues', 'Cão de Água Português', 79),
    ('cao_de_castro_laboreiro', 'Cão de Castro Laboreiro', 80),
    ('cao_de_gado_transmontano', 'Cão de Gado Transmontano', 81),
    ('cao_fila_de_sao_miguel', 'Cão Fila de São Miguel', 82),
    ('cavalier_king_charles_spaniel', 'Cavalier King Charles Spaniel', 83),
    ('centraal_aziatische_ovcharka', 'Centraal-Aziatische Ovcharka', 84),
    ('cesky_fousek', 'Cesky Fousek', 85),
    ('cesky_terrier', 'Cesky Terrier', 86),
    ('chart_polski', 'Chart Polski', 87),
    ('chesapeake_bay_retriever', 'Chesapeake Bay Retriever', 88),
    ('chien_dartois', 'Chien d\'Artois', 89),
    ('chihuahua_korthaar', 'Chihuahua, korthaar', 90),
    ('chihuahua_langhaar', 'Chihuahua, langhaar', 91),
    ('chinese_naakthond', 'Chinese Naakthond', 92),
    ('chodsky_pes', 'Chodsky Pes', 93),
    ('chow_chow', 'Chow Chow', 94),
    ('cimarron_uruguayo', 'Cimarrón Uruguayo', 95),
    ('ciobanese_romanesc_carpatin', 'Ciobănesc Românesc Carpatin', 96),
    ('ciobanesc_romanesc_de_bucovina', 'Ciobănesc Românesc de Bucovina', 97),
    ('ciobanesc_romanesc_mioritic', 'Ciobănesc Românesc Mioritic', 98),
    ('cirneco_delletna', 'Cirneco dell\'Etna', 99),
    ('clumber_spaniel', 'Clumber Spaniel', 100),
    ('continental_bulldog', 'Continental Bulldog', 101),
    ('coton_de_tulear', 'Coton de Tuléar', 102),
    ('crnogorski_planinski_gonic', 'Crnogorski Planinski Gonic', 103),
    ('curly_coated_retriever', 'Curly Coated Retriever', 104),
    ('dalmatische_hond', 'Dalmatische Hond', 105),
    ('dandie_dinmont_terrier', 'Dandie Dinmont Terrier', 106),
    ('dashond_korthaar', 'Dashond, korthaar', 107),
    ('dashond_langhaar', 'Dashond, langhaar', 108),
    ('dashond_ruwhaar', 'Dashond, ruwhaar', 109),
    ('deens_zweedse_boerderijhond', 'Deens-Zweedse Boerderijhond', 110),
    ('deerhound', 'Deerhound', 111),
    ('dobermann', 'Dobermann', 112),
    ('drentsche_patrijshond', 'Drentsche Patrijshond', 113),
    ('drever', 'Drever', 114),
    ('duitse_brak', 'Duitse Brak', 115),
    ('duitse_dog_blauw', 'Duitse Dog, blauw', 116),
    ('duitse_dog_geel_gestroomd', 'Duitse Dog, geel/gestroomd', 117),
    ('duitse_dog_zwart_zwart_wit', 'Duitse Dog, zwart/zwart-wit', 118),
    ('duitse_dwergpinscher', 'Duitse Dwergpinscher', 119),
    ('duitse_herdershond_langstockhaar', 'Duitse Herdershond Langstockhaar', 120),
    ('duitse_herdershond_stokhaar', 'Duitse Herdershond Stokhaar', 121),
    ('duitse_jachtterrier', 'Duitse Jachtterrier', 122),
    ('duitse_pinscher', 'Duitse Pinscher', 123),
    ('duitse_staande_hond_draadhaar', 'Duitse Staande Hond Draadhaar', 124),
    ('duitse_staande_hond_korthaar', 'Duitse Staande Hond Korthaar', 125),
    ('duitse_staande_hond_langhaar', 'Duitse Staande Hond Langhaar', 126),
    ('duitse_staande_hond_stekelhaar', 'Duitse Staande Hond Stekelhaar', 127),
    ('duitse_wachtelhond', 'Duitse Wachtelhond', 128),
    ('dunker', 'Dunker', 129),
    ('dwergdashond_korthaar', 'Dwergdashond, korthaar', 130),
    ('dwergdashond_langhaar', 'Dwergdashond, langhaar', 131),
    ('dwergdashond_ruwhaar', 'Dwergdashond, ruwhaar', 132),
    ('dwergkeeshond', 'Dwergkeeshond', 133),
    ('dwergpoedel', 'Dwergpoedel', 134),
    ('dwergpoedel_grijs_abrikoos_rood', 'Dwergpoedel, grijs-abrikoos-rood', 135),
    ('dwergschnauzer_peper_en_zout', 'Dwergschnauzer, peper en zout', 136),
    ('dwergschnauzer_wit', 'Dwergschnauzer, wit', 137),
    ('dwergschnauzer_zwart', 'Dwergschnauzer, zwart', 138),
    ('dwergschnauzer_zwart_zilver', 'Dwergschnauzer, zwart-zilver', 139),
    ('eesti_hagijas', 'Eesti Hagijas', 140),
    ('engelse_bulldog', 'Engelse Bulldog', 141),
    ('engelse_cocker_spaniel', 'Engelse Cocker Spaniel', 142),
    ('engelse_setter', 'Engelse Setter', 143),
    ('engelse_springer_spaniel', 'Engelse Springer Spaniel', 144),
    ('engelse_toy_terrier', 'Engelse Toy Terrier', 145),
    ('english_foxhound', 'English Foxhound', 146),
    ('entlebucher_sennenhond', 'Entlebucher Sennenhond', 147),
    ('epagneul_bleu_de_picardie', 'Epagneul Bleu de Picardie', 148),
    ('epagneul_breton', 'Epagneul Breton', 149),
    ('epagneul_de_pont_audemer', 'Epagneul de Pont-Audemer', 150),
    ('epagneul_francais', 'Epagneul Français', 151),
    ('epagneul_nain_continental_papillon', 'Epagneul Nain Continental, Papillon', 152),
    ('epagneul_nain_continental_phalene', 'Epagneul Nain Continental, Phalène', 153),
    ('epagneul_picard', 'Epagneul Picard', 154),
    ('erdelyi_kopo', 'Erdélyi Kopó', 155),
    ('eurasier', 'Eurasier', 156),
    ('field_spaniel', 'Field Spaniel', 157),
    ('fila_brasileiro', 'Fila Brasileiro', 158),
    ('finse_brak', 'Finse Brak', 159),
    ('finse_lappenhond', 'Finse Lappenhond', 160),
    ('finse_spits', 'Finse Spits', 161),
    ('flatcoated_retriever', 'Flatcoated Retriever', 162),
    ('foxterrier_draadhaar', 'Foxterrier Draadhaar', 163),
    ('foxterrier_gladhaar', 'Foxterrier Gladhaar', 164),
    ('francais_blanc_et_noir', 'Français Blanc et Noir', 165),
    ('francais_blanc_et_orange', 'Français Blanc et Orange', 166),
    ('francais_tricolore', 'Français Tricolore', 167),
    ('franse_bulldog', 'Franse Bulldog', 168),
    ('galgo_espanol', 'Galgo Español', 169),
    ('gammel_dansk_honsehund', 'Gammel Dansk Hønsehund', 170),
    ('golden_retriever', 'Golden Retriever', 171),
    ('gonczy_polski', 'Gonczy Polski', 172),
    ('gordon_setter', 'Gordon Setter', 173),
    ('gos_datura_catala', 'Gos d\'Atura Català', 174),
    ('grand_anglo_francais_blanc_et_noir', 'Grand Anglo-Français Blanc et Noir', 175),
    ('grand_anglo_francais_blanc_et_orange', 'Grand Anglo-Français Blanc et Orange', 176),
    ('grand_anglo_francais_tricolore', 'Grand Anglo-Français Tricolore', 177),
    ('grand_basset_griffon_vendeen', 'Grand Basset Griffon Vendéen', 178),
    ('grand_bleu_de_gascogne', 'Grand Bleu de Gascogne', 179),
    ('grand_gascon_saintongeois', 'Grand Gascon Saintongeois', 180),
    ('grand_griffon_vendeen', 'Grand Griffon Vendéen', 181),
    ('greyhound', 'Greyhound', 182),
    ('griffon_belge', 'Griffon Belge', 183),
    ('griffon_bleu_de_gascogne', 'Griffon Bleu de Gascogne', 184),
    ('griffon_bruxellois', 'Griffon Bruxellois', 185),
    ('griffon_fauve_de_bretagne', 'Griffon Fauve de Bretagne', 186),
    ('griffon_korthals', 'Griffon Korthals', 187),
    ('griffon_nivernais', 'Griffon Nivernais', 188),
    ('groenlandhond', 'Groenlandhond', 189),
    ('grote_keeshond_bruin_zwart', 'Grote Keeshond, bruin-zwart', 190),
    ('grote_keeshond_wit', 'Grote Keeshond, wit', 191),
    ('grote_keeshond_wolfsgrijs', 'Grote Keeshond, wolfsgrijs', 192),
    ('grote_munsterlander', 'Grote Münsterlander', 193),
    ('grote_poedel', 'Grote Poedel', 194),
    ('grote_poedel_grijs_abrikoos_rood', 'Grote Poedel, grijs-abrikoos-rood', 195),
    ('grote_zwitserse_sennenhond', 'Grote Zwitserse Sennenhond', 196),
    ('haldenstovare', 'Haldenstøvare', 197),
    ('hamiltonstovare', 'Hamiltonstövare', 198),
    ('hannoverscher_schweisshund', 'Hannoverscher Schweisshund', 199),
    ('harrier', 'Harrier', 200),
    ('havanezer', 'Havanezer', 201),
    ('heidewachtel', 'Heidewachtel', 202),
    ('hellinikos_ichnilatis', 'Hellinikos Ichnilatis', 203),
    ('hokkaido', 'Hokkaido', 204),
    ('hollandse_herdershond_korthaar', 'Hollandse Herdershond, korthaar', 205),
    ('hollandse_herdershond_langhaar', 'Hollandse Herdershond, langhaar', 206),
    ('hollandse_herdershond_ruwhaar', 'Hollandse Herdershond, ruwhaar', 207),
    ('hollandse_smoushond', 'Hollandse Smoushond', 208),
    ('hovawart', 'Hovawart', 209),
    ('hrvatski_ovcar', 'Hrvatski Ovčar', 210),
    ('hygenhund', 'Hygenhund', 211),
    ('ierse_rood_witte_setter', 'Ierse Rood-Witte Setter', 212),
    ('ierse_setter', 'Ierse Setter', 213),
    ('ierse_terrier', 'Ierse Terrier', 214),
    ('ierse_water_spaniel', 'Ierse Water Spaniel', 215),
    ('ierse_wolfshond', 'Ierse Wolfshond', 216),
    ('ijslandse_hond', 'IJslandse Hond', 217),
    ('irish_glen_of_imaal_terrier', 'Irish Glen of Imaal Terrier', 218),
    ('irish_soft_coated_wheaten_terrier', 'Irish Soft Coated Wheaten Terrier', 219),
    ('istarski_kratkodiaki_gonic', 'Istarski Kratkodlaki Gonič', 220),
    ('istarski_ostrodlaki_gonic', 'Istarski Ostrodlaki Gonič', 221),
    ('italiaans_windhondje', 'Italiaans Windhondje', 222),
    ('jack_russell_terrier', 'Jack Russell Terrier', 223),
    ('jamthund', 'Jämthund', 224),
    ('japanse_spaniel', 'Japanse Spaniel', 225),
    ('japanse_spits', 'Japanse Spits', 226),
    ('japanse_terrier', 'Japanse Terrier', 227),
    ('jura_laufhund', 'Jura Laufhund', 228),
    ('jura_niederlaufhund', 'Jura Niederlaufhund', 229),
    ('kai', 'Kai', 230),
    ('kangal_kopek', 'Kangal Köpek', 231),
    ('kaninchen_dashond_korthaar', 'Kaninchen Dashond, korthaar', 232),
    ('kaninchen_dashond_langhaar', 'Kaninchen Dashond, langhaar', 233),
    ('kaninchen_dashond_ruwhaar', 'Kaninchen Dashond, ruwhaar', 234),
    ('karelische_berenhond', 'Karelische Berenhond', 235),
    ('kaukasische_ovcharka', 'Kaukasische Ovcharka', 236),
    ('kerry_blue_terrier', 'Kerry Blue Terrier', 237),
    ('king_charles_spaniel', 'King Charles Spaniel', 238),
    ('kintamani_bali_dog', 'Kintamani-Bali Dog', 239),
    ('kishu', 'Kishu', 240),
    ('komondor', 'Komondor', 241),
    ('korea_jindo_dog', 'Korea Jindo Dog', 242),
    ('kraski_ovcar', 'Kraški Ovčar', 243),
    ('kromfohrländer', 'Kromfohrländer', 244),
    ('kuvasz', 'Kuvasz', 245),
    ('labrador_retriever', 'Labrador Retriever', 246),
    ('lagotto_romagnolo', 'Lagotto Romagnolo', 247),
    ('lakeland_terrier', 'Lakeland Terrier', 248),
    ('landseer', 'Landseer', 249),
    ('lapinporokoira', 'Lapinporokoira', 250),
    ('lhasa_apso', 'Lhasa Apso', 251),
    ('lurcher', 'Lurcher', 252),
    ('luzerner_laufhund', 'Luzerner Laufhund', 253),
    ('maltese', 'Maltese', 254),
    ('manchester_terrier', 'Manchester Terrier', 255),
    ('maremma_en_abruzzese', 'Maremma en Abruzzese', 256),
    ('markiesje', 'Markiesje', 257),
    ('mastiff', 'Mastiff', 258),
    ('mastin_del_pirineo', 'Mastín del Pirineo', 259),
    ('mastin_espanol', 'Mastín Español', 260),
    ('mastino_napoletano', 'Mastino Napoletano', 261),
    ('mini_american_shepherd', 'Mini American Shepherd', 262),
    ('miniatuur_bull_terrier', 'Miniatuur Bull Terrier', 263),
    ('miniatuur_pinscher', 'Miniatuur Pinscher', 264),
    ('miniatuur_poedel', 'Miniatuur Poedel', 265),
    ('miniatuur_schnauzer', 'Miniatuur Schnauzer', 266),
    ('montenegrijnse_berghond', 'Montenegrijnse Berghond', 267),
    ('mops', 'Mops', 268),
    ('mudi', 'Mudi', 269),
    ('nederlandse_kooikerhondje', 'Nederlandse Kooikerhondje', 270),
    ('nederlandse_schapendoes', 'Nederlandse Schapendoes', 271),
    ('newfoundland', 'Newfoundland', 272),
    ('norfolk_terrier', 'Norfolk Terrier', 273),
    ('noorse_buhund', 'Noorse Buhund', 274),
    ('noorse_elandhond_grijs', 'Noorse Elandhond, grijs', 275),
    ('noorse_elandhond_zwart', 'Noorse Elandhond, zwart', 276),
    ('noorse_lundehund', 'Noorse Lundehund', 277),
    ('norwich_terrier', 'Norwich Terrier', 278),
    ('oost_siberische_laika', 'Oost-Siberische Laika', 279),
    ('oosterse_spits', 'Oosterse Spits', 280),
    ('otterhound', 'Otterhound', 281),
    ('parson_russell_terrier', 'Parson Russell Terrier', 282),
    ('perdigueiro_portugues', 'Perdigueiro Português', 283),
    ('perro_de_agua_espanol', 'Perro de Agua Español', 284),
    ('perro_de_presa_canario', 'Perro de Presa Canario', 285),
    ('petit_basset_griffon_vendeen', 'Petit Basset Griffon Vendéen', 286),
    ('petit_bleu_de_gascogne', 'Petit Bleu de Gascogne', 287),
    ('petit_brabancon', 'Petit Brabançon', 288),
    ('pharaohond', 'Pharaohond', 289),
    ('picardy', 'Picardy', 290),
    ('podenco_canario', 'Podenco Canario', 291),
    ('podenco_ibicenco', 'Podenco Ibicenco', 292),
    ('podengo_portugues', 'Podengo Português', 293),
    ('poedelpointer', 'Poedelpointer', 294),
    ('pointer', 'Pointer', 295),
    ('polski_owczarek_nizinny', 'Polski Owczarek Nizinny', 296),
    ('polski_owczarek_podhalanski', 'Polski Owczarek Podhalański', 297),
    ('portugese_podengo', 'Portugese Podengo', 298),
    ('prazsky_krysarik', 'Pražský Krysařík', 299),
    ('puli', 'Puli', 300),
    ('pumi', 'Pumi', 301),
    ('pyreneese_berghond', 'Pyreneese Berghond', 302),
    ('pyreneese_herdershond', 'Pyreneese Herdershond', 303),
    ('rafeiro_do_alentejo', 'Rafeiro do Alentejo', 304),
    ('rhodesian_ridgeback', 'Rhodesian Ridgeback', 305),
    ('rottweiler', 'Rottweiler', 306),
    ('russische_zwarte_terrier', 'Russische Zwarte Terrier', 307),
    ('russkiy_toy', 'Russkiy Toy', 308),
    ('saarlooswolfhond', 'Saarlooswolfhond', 309),
    ('saluki', 'Saluki', 310),
    ('samojeed', 'Samojeed', 311),
    ('schillerstovare', 'Schillerstövare', 312),
    ('schotse_herdershond_korthaar', 'Schotse Herdershond, Korthaar', 313),
    ('schotse_herdershond_langhaar', 'Schotse Herdershond, Langhaar', 314),
    ('schotse_terrier', 'Schotse Terrier', 315),
    ('sealyham_terrier', 'Sealyham Terrier', 316),
    ('shar_pei', 'Shar-Pei', 317),
    ('shiba_inu', 'Shiba Inu', 318),
    ('shih_tzu', 'Shih Tzu', 319),
    ('siberische_husky', 'Siberische Husky', 320),
    ('silky_terrier', 'Silky Terrier', 321),
    ('sloughi', 'Sloughi', 322),
    ('slovensky_cuvac', 'Slovenský Čuvač', 323),
    ('slovensky_kopov', 'Slovenský Kopov', 324),
    ('smalandsstovare', 'Smålandsstövare', 325),
    ('soft_coated_wheaten_terrier', 'Soft Coated Wheaten Terrier', 326),
    ('spaniel_van_pont_audemer', 'Spaniel van Pont-Audemer', 327),
    ('spaanse_mastiff', 'Spaanse Mastiff', 328),
    ('spaanse_waterhond', 'Spaanse Waterhond', 329),
    ('spinone_italiano', 'Spinone Italiano', 330),
    ('srpski_gonic', 'Srpski Gonič', 331),
    ('srpski_trobojni_gonic', 'Srpski Trobojni Gonič', 332),
    ('stabijhoun', 'Stabijhoun', 333),
    ('staffordshire_bull_terrier', 'Staffordshire Bull Terrier', 334),
    ('sussex_spaniel', 'Sussex Spaniel', 335),
    ('taigan', 'Taigan', 336),
    ('tatrahond', 'Tatrahond', 337),
    ('tervuerense_herdershond', 'Tervuerense Herdershond', 338),
    ('thai_ridgeback', 'Thai Ridgeback', 339),
    ('tibetaanse_mastiff', 'Tibetaanse Mastiff', 340),
    ('tibetaanse_spaniel', 'Tibetaanse Spaniel', 341),
    ('tibetaanse_terrier', 'Tibetaanse Terrier', 342),
    ('toy_poedel', 'Toy Poedel', 343),
    ('vizsla_draadhaar', 'Vizsla, Draadhaar', 344),
    ('vizsla_korthaar', 'Vizsla, Korthaar', 345),
    ('volpino_italiano', 'Volpino Italiano', 346),
    ('weimaraner', 'Weimaraner', 347),
    ('welsh_corgi_cardigan', 'Welsh Corgi Cardigan', 348),
    ('welsh_corgi_pembroke', 'Welsh Corgi Pembroke', 349),
    ('welsh_springer_spaniel', 'Welsh Springer Spaniel', 350),
    ('welsh_terrier', 'Welsh Terrier', 351),
    ('west_highland_white_terrier', 'West Highland White Terrier', 352),
    ('west_siberische_laika', 'West-Siberische Laika', 353),
    ('whippet', 'Whippet', 354),
    ('wetterhoun', 'Wetterhoun', 355),
    ('yorkshire_terrier', 'Yorkshire Terrier', 356),
    ('zuid_russische_ovcharka', 'Zuid-Russische Ovcharka', 357),
    ('zwart_russische_terrier', 'Zwart Russische Terrier', 358),
    ('zweedse_lappenhond', 'Zweedse Lappenhond', 359),
    ('zwitserse_witte_herdershond', 'Zwitserse Witte Herdershond', 360);

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

-- Create TravelTime table if it doesn't exist
CREATE TABLE IF NOT EXISTS `TravelTime` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `IsHomeToWork` tinyint(1) NOT NULL,
  `Duration` int(11) NOT NULL,
  `Distance` int(11) DEFAULT NULL,
  `CreatedOn` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Users table to store user information
CREATE TABLE IF NOT EXISTS `Users` (
  `id` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `picture` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add the Sessions table to support session-based authentication
CREATE TABLE IF NOT EXISTS `Sessions` (
  `id` varchar(64) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `access_token` text NOT NULL,
  `refresh_token` text NOT NULL,
  `token_expires` datetime NOT NULL,
  `session_expires` datetime NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_expires_index` (`session_expires`),
  CONSTRAINT `sessions_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create OAuthState table for CSRF protection
CREATE TABLE IF NOT EXISTS `OAuthState` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `state` varchar(32) NOT NULL,
  `expires` datetime NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `oauth_state_state_unique` (`state`),
  KEY `oauth_state_expires_index` (`expires`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create backup_history table to track automatic backups
CREATE TABLE IF NOT EXISTS `backup_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(255) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_id` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `backup_history_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;