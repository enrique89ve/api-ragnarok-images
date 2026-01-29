import { Database } from "bun:sqlite";
import type { CardRow } from "@/types";

// Ruta de la base de datos - el árbol donde almacenamos las cartas
const DB_PATH = Bun.env.DB_PATH ?? "cards.sqlite";

const db = new Database(DB_PATH);

// Schema de la tabla cards
// El índice en set_code acelera las búsquedas por colección
db.exec(`
	CREATE TABLE IF NOT EXISTS cards (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		set_code TEXT,
		image_file TEXT NOT NULL,
		description TEXT,
		attack INTEGER,
		health INTEGER,
		cost INTEGER,
		created_at TEXT NOT NULL DEFAULT (datetime('now'))
	);
	CREATE INDEX IF NOT EXISTS idx_cards_set_code ON cards(set_code);
`);

// Invoca todas las cartas del reino
export function getAllCards(): CardRow[] {
	return db.query<CardRow, []>("SELECT * FROM cards ORDER BY id ASC").all();
}

// Filtra por colección (norse-gods, monsters, etc)
export function getCardsBySet(setCode: string): CardRow[] {
	return db
		.query<CardRow, [string]>("SELECT * FROM cards WHERE set_code = ? ORDER BY id ASC")
		.all(setCode);
}

// Búsqueda por nombre - útil cuando no recuerdas el ID exacto
export function searchCardsByName(query: string): CardRow[] {
	return db
		.query<CardRow, [string]>("SELECT * FROM cards WHERE name LIKE ? ORDER BY id ASC")
		.all(`%${query}%`);
}

// Obtiene una carta específica por su ID único
export function getCardById(id: string): CardRow | null {
	return db
		.query<CardRow, [string]>("SELECT * FROM cards WHERE id = ? LIMIT 1")
		.get(id);
}

// Cuenta total de cartas en la base
export function countCards(): number {
	const result = db.query<{ count: number }, []>("SELECT COUNT(*) as count FROM cards").get();
	return result?.count ?? 0;
}

// Paginación para listados grandes - evita cargar todo en memoria
export function getCardsPaginated(page: number, limit: number): CardRow[] {
	const offset = (page - 1) * limit;
	return db
		.query<CardRow, [number, number]>("SELECT * FROM cards ORDER BY id ASC LIMIT ? OFFSET ?")
		.all(limit, offset);
}

export const databaseService = {
	getAllCards,
	getCardsBySet,
	searchCardsByName,
	getCardById,
	countCards,
	getCardsPaginated,
};
