import { cardsService } from "@/services/cards";
import { openApiSpec } from "@/openapi";

// Regex para validar IDs de cartas (alfanumérico + guiones)
const CARD_ID_PATTERN = /^\/cards\/([a-zA-Z0-9_-]+)$/;

// Headers que permiten conexiones desde cualquier reino (CORS)
const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET,OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type",
};

const jsonHeaders = {
	"Content-Type": "application/json; charset=utf-8",
	"X-Powered-By": "Yggdrasil",
	...corsHeaders,
};

function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
}

const server = Bun.serve({
	port: Bun.env.PORT ?? 3000,
	async fetch(req) {
		const { pathname, searchParams } = new URL(req.url);

		// Preflight CORS
		if (req.method === "OPTIONS") {
			return new Response(null, { headers: corsHeaders });
		}

		// Health check - siempre útil para monitoreo
		if (pathname === "/health") {
			return jsonResponse({ ok: true, realm: "midgard" });
		}

		// Documentación interactiva con Scalar
		if (pathname === "/docs") {
			const html = `<!DOCTYPE html>
<html>
<head>
	<title>Ragnarok Cards API</title>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body>
	<script id="api-reference" data-url="/openapi.json"></script>
	<script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>`;
			return new Response(html, { headers: { "Content-Type": "text/html" } });
		}

		// OpenAPI spec para herramientas externas
		if (pathname === "/openapi.json") {
			return jsonResponse(openApiSpec);
		}

		// Lista simple de cartas - solo lo esencial
		if (req.method === "GET" && pathname === "/cards") {
			const setCode = searchParams.get("set") ?? undefined;
			const query = searchParams.get("q") ?? undefined;
			const cards = cardsService.listCards(setCode, query);
			return jsonResponse(cards);
		}

		// Lista completa con stats de batalla
		if (req.method === "GET" && pathname === "/cards/stats") {
			const setCode = searchParams.get("set") ?? undefined;
			const query = searchParams.get("q") ?? undefined;
			const cards = cardsService.listCardsWithStats(setCode, query);
			return jsonResponse(cards);
		}

		// Listado paginado - ideal para tablas y grids
		if (req.method === "GET" && pathname === "/cards/all") {
			const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
			const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
			const result = cardsService.listAllCards(page, limit);
			return jsonResponse(result);
		}

		// Detalle de una carta específica
		const cardMatch = pathname.match(CARD_ID_PATTERN);
		if (req.method === "GET" && cardMatch) {
			const id = cardMatch[1]!;
			const card = cardsService.getCard(id);

			if (!card) {
				return jsonResponse({
					error: "Esta carta se perdió en el Ragnarok",
					hint: "Verifica el ID o consulta /cards"
				}, 404);
			}

			return jsonResponse(card);
		}

		// Ruta no encontrada
		return jsonResponse({
			error: "Te has perdido en Niflheim",
			hint: "Consulta /docs para ver las rutas disponibles"
		}, 404);
	},
});

// Mensaje de inicio
console.log(`Bifrost abierto en http://localhost:${server.port}`);
console.log(`Docs: http://localhost:${server.port}/docs`);
