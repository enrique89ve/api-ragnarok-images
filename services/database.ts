import postgres from "postgres";
import type { CardJoinRow } from "@/types";

const DATABASE_URL = Bun.env.DATABASE_URL ?? "postgresql://localhost:5432/ragnarok";
const sql = postgres(DATABASE_URL);

const BASE_QUERY = `
	SELECT
		c.art_id,
		c."CharacterID",
		ch."NameSlug",
		c.is_main,
		ch."FullName",
		ch."Category",
		ch."ShortDescription",
		ch."Lore",
		ch."ElementType",
		ch."ChessPiece",
		ch."Faction",
		ch."Rarity",
		ch."Link",
		s."Health",
		s."Stamina",
		s."Attack",
		s."Speed",
		s."Mana",
		s."Weight"
	FROM cards c
	JOIN characters ch ON c."CharacterID" = ch."CharacterID"
	LEFT JOIN stats s ON c."CharacterID" = s."CharacterID"
`;

export async function getAllCards(): Promise<CardJoinRow[]> {
	return sql.unsafe<CardJoinRow[]>(`${BASE_QUERY} ORDER BY ch."FullName" ASC`);
}

export async function getCardsByFaction(faction: string): Promise<CardJoinRow[]> {
	return sql.unsafe<CardJoinRow[]>(
		`${BASE_QUERY} WHERE ch."Faction" = $1 ORDER BY ch."FullName" ASC`,
		[faction]
	);
}

export async function getCardsByElement(element: string): Promise<CardJoinRow[]> {
	return sql.unsafe<CardJoinRow[]>(
		`${BASE_QUERY} WHERE ch."ElementType" = $1 ORDER BY ch."FullName" ASC`,
		[element]
	);
}

export async function getCardsByRarity(rarity: string): Promise<CardJoinRow[]> {
	return sql.unsafe<CardJoinRow[]>(
		`${BASE_QUERY} WHERE ch."Rarity" = $1 ORDER BY ch."FullName" ASC`,
		[rarity]
	);
}

export async function searchCards(query: string): Promise<CardJoinRow[]> {
	const byId = await sql.unsafe<CardJoinRow[]>(
		`${BASE_QUERY} WHERE c.art_id = $1`,
		[query]
	);

	if (byId.length > 0) return byId;

	const pattern = `%${query}%`;
	const byPartialId = await sql.unsafe<CardJoinRow[]>(
		`${BASE_QUERY} WHERE c.art_id ILIKE $1 ORDER BY c.art_id ASC`,
		[pattern]
	);

	if (byPartialId.length > 0) return byPartialId;

	return sql.unsafe<CardJoinRow[]>(
		`${BASE_QUERY} WHERE ch."FullName" ILIKE $1 ORDER BY ch."FullName" ASC`,
		[pattern]
	);
}

export async function getCardById(artId: string): Promise<CardJoinRow | null> {
	const rows = await sql.unsafe<CardJoinRow[]>(
		`${BASE_QUERY} WHERE c.art_id = $1 LIMIT 1`,
		[artId]
	);
	return rows[0] ?? null;
}

export async function countCards(): Promise<number> {
	const result = await sql<{ count: string }[]>`SELECT COUNT(*) as count FROM cards`;
	return parseInt(result[0]?.count ?? "0", 10);
}

export async function getCardsPaginated(page: number, limit: number): Promise<CardJoinRow[]> {
	const offset = (page - 1) * limit;
	return sql.unsafe<CardJoinRow[]>(
		`${BASE_QUERY} ORDER BY ch."FullName" ASC LIMIT $1 OFFSET $2`,
		[limit, offset]
	);
}

export const databaseService = {
	getAllCards,
	getCardsByFaction,
	getCardsByElement,
	getCardsByRarity,
	searchCards,
	getCardById,
	countCards,
	getCardsPaginated,
};
