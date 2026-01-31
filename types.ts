// Domain constants - single source of truth
export const FACTIONS = ["aesir", "vanir", "jotnar", "mystical beings", "pets"] as const;
export const ELEMENTS = ["fire", "water", "wind", "earth"] as const;
export const RARITIES = ["common", "rare", "epic", "legendary"] as const;
export const CHESS_PIECES = ["king", "queen", "rook", "bishop", "knight", "pawn"] as const;

// Derived types from constants
export type Faction = (typeof FACTIONS)[number];
export type Element = (typeof ELEMENTS)[number];
export type Rarity = (typeof RARITIES)[number];
export type ChessPiece = (typeof CHESS_PIECES)[number];

// Database row types - what comes from PostgreSQL
export interface CharacterRow {
	CharacterID: string;
	NameSlug: string;
	FullName: string;
	Category: string | null;
	ShortDescription: string | null;
	Lore: string | null;
	ElementType: string | null;
	ChessPiece: string | null;
	Faction: string | null;
	Rarity: string | null;
	Link: string | null;
}

export interface StatsRow {
	CharacterID: string;
	NameSlug: string;
	Health: number | null;
	Stamina: number | null;
	Attack: number | null;
	Speed: number | null;
	Mana: number | null;
	Weight: number | null;
}

export interface CardRow {
	art_id: string;
	CharacterID: string;
	is_main: boolean;
}

// Join result - card with character data and stats
export interface CardJoinRow {
	art_id: string;
	CharacterID: string;
	NameSlug: string;
	is_main: boolean;
	FullName: string;
	Category: string | null;
	ShortDescription: string | null;
	Lore: string | null;
	ElementType: string | null;
	ChessPiece: string | null;
	Faction: string | null;
	Rarity: string | null;
	Link: string | null;
	Health: number | null;
	Stamina: number | null;
	Attack: number | null;
	Speed: number | null;
	Mana: number | null;
	Weight: number | null;
}

// API response types - literal and easy to understand names
export interface CardStats {
	health: number | null;
	stamina: number | null;
	attack: number | null;
	speed: number | null;
	mana: number | null;
	weight: number | null;
}

export interface SimpleCard {
	id: string;
	name: string;
	image: string;
}

export interface PublicCard {
	id: string;
	character: string;
	name: string;
	category: string | null;
	description: string | null;
	lore: string | null;
	element: string | null;
	piece: string | null;
	faction: string | null;
	rarity: string | null;
	mainArt: boolean;
	stats: CardStats;
	image: string;
	wiki: string | null;
}

export interface TableCard {
	id: string;
	character: string;
	name: string;
	element: string | null;
	faction: string | null;
	rarity: string | null;
	health: number | null;
	attack: number | null;
	mainArt: boolean;
	image: string;
}

export interface PaginatedResult<T> {
	data: T[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

export interface ApiError {
	error: string;
	hint?: string;
}
