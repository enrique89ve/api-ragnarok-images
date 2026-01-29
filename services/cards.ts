import type { CardRow, PublicCard, SimpleCard, TableCard, PaginatedResult } from "@/types";
import { databaseService } from "@/services/database";

// CDN donde viven las imágenes de las cartas
const CDN_BASE = Bun.env.CDN_BASE ?? "https://cdn.d.v1.ragnaroknft.quest";

// Construye la URL completa de la imagen
function buildImageUrl(imageFile: string): string {
	return `${CDN_BASE}/${encodeURIComponent(imageFile)}`;
}

// Transformadores: convierten el formato de BD al formato de API
// Cada uno expone diferentes niveles de detalle

function toSimpleCard(card: CardRow): SimpleCard {
	return {
		id: card.id,
		name: card.name,
		image: buildImageUrl(card.image_file),
	};
}

function toPublicCard(card: CardRow): PublicCard {
	return {
		id: card.id,
		name: card.name,
		set: card.set_code,
		description: card.description,
		stats: {
			cost: card.cost,
			attack: card.attack,
			health: card.health,
		},
		image: {
			file: card.image_file,
			url: buildImageUrl(card.image_file),
		},
		createdAt: card.created_at,
	};
}

function toTableCard(card: CardRow): TableCard {
	return {
		id: card.id,
		name: card.name,
		set: card.set_code,
		cost: card.cost,
		attack: card.attack,
		health: card.health,
		image: buildImageUrl(card.image_file),
		createdAt: card.created_at,
	};
}

// Lista simple - solo id, nombre e imagen
// Ideal para galería, autocompletado, previews
export function listCards(setCode?: string, query?: string): SimpleCard[] {
	let cards: CardRow[];

	if (setCode) {
		cards = databaseService.getCardsBySet(setCode);
	} else if (query) {
		cards = databaseService.searchCardsByName(query);
	} else {
		cards = databaseService.getAllCards();
	}

	return cards.map(toSimpleCard);
}

// Lista completa con stats de batalla
// Para cuando necesitas mostrar poder, vida, costo
export function listCardsWithStats(setCode?: string, query?: string): PublicCard[] {
	let cards: CardRow[];

	if (setCode) {
		cards = databaseService.getCardsBySet(setCode);
	} else if (query) {
		cards = databaseService.searchCardsByName(query);
	} else {
		cards = databaseService.getAllCards();
	}

	return cards.map(toPublicCard);
}

// Listado paginado para tablas y grids
// Incluye metadata de paginación para UI
export function listAllCards(page: number, limit: number): PaginatedResult<TableCard> {
	const total = databaseService.countCards();
	const cards = databaseService.getCardsPaginated(page, limit);

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

// Detalle completo de una carta específica
export function getCard(id: string): PublicCard | null {
	const card = databaseService.getCardById(id);
	return card ? toPublicCard(card) : null;
}

export const cardsService = {
	listCards,
	listCardsWithStats,
	listAllCards,
	getCard,
};
