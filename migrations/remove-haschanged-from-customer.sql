-- Migration to remove HasChanged column from Customer table
ALTER TABLE Customer DROP COLUMN HasChanged; 