export interface CardRow {
	id: string;
	name: string;
	set_code: string | null;
	image_file: string;
	description: string | null;
	attack: number | null;
	health: number | null;
	cost: number | null;
	created_at: string;
}

export interface CardStats {
	cost: number | null;
	attack: number | null;
	health: number | null;
}

export interface CardImage {
	file: string;
	url: string;
}

export interface PublicCard {
	id: string;
	name: string;
	set: string | null;
	description: string | null;
	stats: CardStats;
	image: CardImage;
	createdAt: string;
}

export interface SimpleCard {
	id: string;
	name: string;
	image: string;
}

export interface TableCard {
	id: string;
	name: string;
	set: string | null;
	cost: number | null;
	attack: number | null;
	health: number | null;
	image: string;
	createdAt: string;
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
	details?: string[];
}
