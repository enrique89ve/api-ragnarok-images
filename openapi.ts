export const openApiSpec = {
	openapi: "3.1.0",
	info: {
		title: "Ragnarok Cards API",
		version: "1.0.0",
		description: "API de solo lectura para consultar cartas del juego Ragnarok NFT. Las imágenes se sirven desde Cloudflare CDN.",
	},
	servers: [
		{
			url: "http://localhost:3000",
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
				description: "Returns a simple list with id, name, and image URL only",
				tags: ["Cards"],
				parameters: [
					{
						name: "set",
						in: "query",
						description: "Filter by set code",
						schema: { type: "string" },
					},
					{
						name: "q",
						in: "query",
						description: "Search by name",
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
				description: "Returns full card details including stats, description, and timestamps",
				tags: ["Cards"],
				parameters: [
					{
						name: "set",
						in: "query",
						description: "Filter by set code",
						schema: { type: "string" },
					},
					{
						name: "q",
						in: "query",
						description: "Search by name",
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
				tags: ["Cards"],
				parameters: [
					{
						name: "id",
						in: "path",
						required: true,
						description: "Card ID",
						schema: { type: "string" },
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
					id: { type: "string", example: "odin-001" },
					name: { type: "string", example: "Odin, Allfather" },
					image: { type: "string", format: "uri", example: "https://cdn.d.v1.ragnaroknft.quest/odin-001.webp" },
				},
				required: ["id", "name", "image"],
			},
			PublicCard: {
				type: "object",
				properties: {
					id: { type: "string", example: "odin-001" },
					name: { type: "string", example: "Odin, Allfather" },
					set: { type: "string", nullable: true, example: "norse-gods" },
					description: { type: "string", nullable: true, example: "The king of Asgard" },
					stats: { $ref: "#/components/schemas/CardStats" },
					image: { $ref: "#/components/schemas/CardImage" },
					createdAt: { type: "string", example: "2026-01-29 04:33:59" },
				},
			},
			CardStats: {
				type: "object",
				properties: {
					cost: { type: "integer", nullable: true, example: 8 },
					attack: { type: "integer", nullable: true, example: 6 },
					health: { type: "integer", nullable: true, example: 10 },
				},
			},
			CardImage: {
				type: "object",
				properties: {
					file: { type: "string", example: "odin-001.webp" },
					url: { type: "string", format: "uri", example: "https://cdn.d.v1.ragnaroknft.quest/odin-001.webp" },
				},
			},
			TableCard: {
				type: "object",
				properties: {
					id: { type: "string" },
					name: { type: "string" },
					set: { type: "string", nullable: true },
					cost: { type: "integer", nullable: true },
					attack: { type: "integer", nullable: true },
					health: { type: "integer", nullable: true },
					image: { type: "string", format: "uri" },
					createdAt: { type: "string" },
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
							total: { type: "integer", example: 150 },
							totalPages: { type: "integer", example: 8 },
						},
					},
				},
			},
			ApiError: {
				type: "object",
				properties: {
					error: { type: "string", example: "Validation failed" },
					details: {
						type: "array",
						items: { type: "string" },
						example: ["id is required", "name is required"],
					},
				},
			},
		},
	},
};
