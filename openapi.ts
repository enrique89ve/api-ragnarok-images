export const openApiSpec = {
	openapi: "3.1.0",
	info: {
		title: "Ragnarok Cards API",
		version: "1.0.0",
		description: "Read-only API for querying Ragnarok NFT game cards. 406 cards, 197 characters. Images served from Cloudflare CDN.",
	},
	servers: [
		{
			url: "http://localhost:4005",
			description: "Local development",
		},
	],
	paths: {
		"/health": {
			get: {
				summary: "Health check",
				tags: ["System"],
				responses: {
					"200": {
						description: "API is healthy",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										ok: { type: "boolean", example: true },
										realm: { type: "string", example: "midgard" },
									},
								},
							},
						},
					},
				},
			},
		},
		"/cards": {
			get: {
				summary: "List cards (simple)",
				description: "Returns a simple list with id, name, and image URL. Ideal for galleries and autocomplete.",
				tags: ["Cards"],
				parameters: [
					{
						name: "faction",
						in: "query",
						description: "Filter by faction",
						schema: {
							type: "string",
							enum: ["aesir", "vanir", "jotnar", "mystical beings", "pets"],
						},
					},
					{
						name: "element",
						in: "query",
						description: "Filter by element",
						schema: {
							type: "string",
							enum: ["fire", "water", "wind", "earth"],
						},
					},
					{
						name: "q",
						in: "query",
						description: "Search by character name",
						schema: { type: "string" },
					},
				],
				responses: {
					"200": {
						description: "List of simple cards",
						content: {
							"application/json": {
								schema: {
									type: "array",
									items: { $ref: "#/components/schemas/SimpleCard" },
								},
							},
						},
					},
				},
			},
		},
		"/cards/stats": {
			get: {
				summary: "List cards (full with stats)",
				description: "Returns full card details including stats, lore, and character info.",
				tags: ["Cards"],
				parameters: [
					{
						name: "faction",
						in: "query",
						description: "Filter by faction",
						schema: {
							type: "string",
							enum: ["aesir", "vanir", "jotnar", "mystical beings", "pets"],
						},
					},
					{
						name: "element",
						in: "query",
						description: "Filter by element",
						schema: {
							type: "string",
							enum: ["fire", "water", "wind", "earth"],
						},
					},
					{
						name: "q",
						in: "query",
						description: "Search by character name",
						schema: { type: "string" },
					},
				],
				responses: {
					"200": {
						description: "List of full cards",
						content: {
							"application/json": {
								schema: {
									type: "array",
									items: { $ref: "#/components/schemas/PublicCard" },
								},
							},
						},
					},
				},
			},
		},
		"/cards/all": {
			get: {
				summary: "List all cards (paginated)",
				description: "Returns paginated cards for table display",
				tags: ["Cards"],
				parameters: [
					{
						name: "page",
						in: "query",
						description: "Page number (default: 1)",
						schema: { type: "integer", default: 1, minimum: 1 },
					},
					{
						name: "limit",
						in: "query",
						description: "Items per page (default: 20, max: 100)",
						schema: { type: "integer", default: 20, minimum: 1, maximum: 100 },
					},
				],
				responses: {
					"200": {
						description: "Paginated cards",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/PaginatedTableCards" },
							},
						},
					},
				},
			},
		},
		"/cards/{id}": {
			get: {
				summary: "Get card by ID",
				description: "Returns full details for a specific card artwork",
				tags: ["Cards"],
				parameters: [
					{
						name: "id",
						in: "path",
						required: true,
						description: "Card art ID",
						schema: { type: "string" },
						example: "6333-p1fmzcky",
					},
				],
				responses: {
					"200": {
						description: "Card details",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/PublicCard" },
							},
						},
					},
					"404": {
						description: "Card not found",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ApiError" },
							},
						},
					},
				},
			},
		},
	},
	components: {
		schemas: {
			SimpleCard: {
				type: "object",
				properties: {
					id: { type: "string", example: "6333-p1fmzcky" },
					name: { type: "string", example: "frigg" },
					image: { type: "string", format: "uri", example: "https://cdn.d.v1.ragnaroknft.quest/6333-p1fmzcky.webp" },
				},
				required: ["id", "name", "image"],
			},
			PublicCard: {
				type: "object",
				properties: {
					id: { type: "string", example: "6333-p1fmzcky" },
					character: { type: "string", example: "frigg" },
					name: { type: "string", example: "frigg" },
					category: { type: "string", nullable: true, example: "goddesses" },
					description: { type: "string", nullable: true, example: "odin's wife, wisdom" },
					lore: { type: "string", nullable: true, example: "odin's wife, associated with foresight and wisdom, mother of baldr." },
					element: { type: "string", nullable: true, example: "wind" },
					piece: { type: "string", nullable: true, example: "queen" },
					faction: { type: "string", nullable: true, example: "aesir" },
					rarity: { type: "string", nullable: true, example: "rare" },
					mainArt: { type: "boolean", example: true },
					stats: { $ref: "#/components/schemas/CardStats" },
					image: { type: "string", format: "uri", example: "https://cdn.d.v1.ragnaroknft.quest/6333-p1fmzcky.webp" },
					wiki: { type: "string", nullable: true, format: "uri", example: "https://mythus.fandom.com/wiki/frigg" },
				},
			},
			CardStats: {
				type: "object",
				properties: {
					health: { type: "integer", nullable: true, example: 300 },
					stamina: { type: "integer", nullable: true, example: null },
					attack: { type: "integer", nullable: true, example: null },
					speed: { type: "integer", nullable: true, example: null },
					mana: { type: "integer", nullable: true, example: null },
					weight: { type: "integer", nullable: true, example: 80 },
				},
			},
			TableCard: {
				type: "object",
				properties: {
					id: { type: "string", example: "6333-p1fmzcky" },
					character: { type: "string", example: "frigg" },
					name: { type: "string", example: "frigg" },
					element: { type: "string", nullable: true, example: "wind" },
					faction: { type: "string", nullable: true, example: "aesir" },
					rarity: { type: "string", nullable: true, example: "rare" },
					health: { type: "integer", nullable: true, example: 300 },
					attack: { type: "integer", nullable: true, example: null },
					mainArt: { type: "boolean", example: true },
					image: { type: "string", format: "uri", example: "https://cdn.d.v1.ragnaroknft.quest/6333-p1fmzcky.webp" },
				},
			},
			PaginatedTableCards: {
				type: "object",
				properties: {
					data: {
						type: "array",
						items: { $ref: "#/components/schemas/TableCard" },
					},
					pagination: {
						type: "object",
						properties: {
							page: { type: "integer", example: 1 },
							limit: { type: "integer", example: 20 },
							total: { type: "integer", example: 406 },
							totalPages: { type: "integer", example: 21 },
						},
					},
				},
			},
			ApiError: {
				type: "object",
				properties: {
					error: { type: "string", example: "This card was lost in Ragnarok" },
					hint: { type: "string", example: "Check the ID or browse /cards" },
				},
			},
		},
	},
};
