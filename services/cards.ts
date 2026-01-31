import type { CardJoinRow, PublicCard, SimpleCard, TableCard, PaginatedResult } from "@/types";
import { databaseService } from "@/services/database";

const CDN_BASE = Bun.env.CDN_BASE ?? "https://cdn.d.v1.ragnaroknft.quest";

function buildImageUrl(artId: string): string {
	return `${CDN_BASE}/${artId}.webp`;
}

interface CardFilter {
	faction?: string;
	element?: string;
	query?: string;
}

async function fetchCards(filter?: CardFilter): Promise<CardJoinRow[]> {
	if (filter?.faction) {
		return databaseService.getCardsByFaction(filter.faction);
	}
	if (filter?.element) {
		return databaseService.getCardsByElement(filter.element);
	}
	if (filter?.query) {
		return databaseService.searchCards(filter.query);
	}
	return databaseService.getAllCards();
}

function toSimpleCard(card: CardJoinRow): SimpleCard {
	return {
		id: card.art_id,
		name: card.FullName,
		image: buildImageUrl(card.art_id),
	};
}

function toPublicCard(card: CardJoinRow): PublicCard {
	return {
		id: card.art_id,
		character: card.NameSlug,
		name: card.FullName,
		category: card.Category,
		description: card.ShortDescription,
		lore: card.Lore,
		element: card.ElementType,
		piece: card.ChessPiece,
		faction: card.Faction,
		rarity: card.Rarity,
		mainArt: card.is_main,
		stats: {
			health: card.Health,
			stamina: card.Stamina,
			attack: card.Attack,
			speed: card.Speed,
			mana: card.Mana,
			weight: card.Weight,
		},
		image: buildImageUrl(card.art_id),
		wiki: card.Link,
	};
}

function toTableCard(card: CardJoinRow): TableCard {
	return {
		id: card.art_id,
		character: card.NameSlug,
		name: card.FullName,
		element: card.ElementType,
		faction: card.Faction,
		rarity: card.Rarity,
		health: card.Health,
		attack: card.Attack,
		mainArt: card.is_main,
		image: buildImageUrl(card.art_id),
	};
}

export async function listCards(
	faction?: string,
	element?: string,
	query?: string
): Promise<SimpleCard[]> {
	const cards = await fetchCards({ faction, element, query });
	return cards.map(toSimpleCard);
}

export async function listCardsWithStats(
	faction?: string,
	element?: string,
	query?: string
): Promise<PublicCard[]> {
	const cards = await fetchCards({ faction, element, query });
	return cards.map(toPublicCard);
}

export async function listAllCards(
	page: number,
	limit: number
): Promise<PaginatedResult<TableCard>> {
	const [total, cards] = await Promise.all([
		databaseService.countCards(),
		databaseService.getCardsPaginated(page, limit),
	]);

	return {
		data: cards.map(toTableCard),
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
}

export async function getCard(id: string): Promise<PublicCard | null> {
	const card = await databaseService.getCardById(id);
	return card ? toPublicCard(card) : null;
}

export const cardsService = {
	listCards,
	listCardsWithStats,
	listAllCards,
	getCard,
};
