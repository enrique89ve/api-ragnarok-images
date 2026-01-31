-- PostgreSQL Schema for Ragnarok Cards API
-- Run in Dokploy: psql $DATABASE_URL -f schema.sql

-- Characters table
CREATE TABLE IF NOT EXISTS characters (
	"CharacterID" TEXT PRIMARY KEY,
	"NameSlug" TEXT NOT NULL,
	"FullName" TEXT NOT NULL,
	"Category" TEXT,
	"ShortDescription" TEXT,
	"Lore" TEXT,
	"ElementType" TEXT,
	"ChessPiece" TEXT,
	"Faction" TEXT,
	"Rarity" TEXT,
	"Link" TEXT
);

-- Cards table
CREATE TABLE IF NOT EXISTS cards (
	art_id TEXT PRIMARY KEY,
	"CharacterID" TEXT NOT NULL REFERENCES characters("CharacterID"),
	is_main BOOLEAN DEFAULT FALSE
);

-- Stats table
CREATE TABLE IF NOT EXISTS stats (
	"CharacterID" TEXT PRIMARY KEY REFERENCES characters("CharacterID"),
	"NameSlug" TEXT,
	"Health" INTEGER,
	"Stamina" INTEGER,
	"Attack" INTEGER,
	"Speed" INTEGER,
	"Mana" INTEGER,
	"Weight" INTEGER
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_cards_character ON cards("CharacterID");
CREATE INDEX IF NOT EXISTS idx_characters_faction ON characters("Faction");
CREATE INDEX IF NOT EXISTS idx_characters_element ON characters("ElementType");
CREATE INDEX IF NOT EXISTS idx_characters_rarity ON characters("Rarity");
CREATE INDEX IF NOT EXISTS idx_characters_fullname ON characters("FullName");
