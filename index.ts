import { cardsService } from "@/services/cards";
import { getOpenApiSpec } from "@/openapi";

const CARD_ID_PATTERN = /^\/cards\/([a-zA-Z0-9_-]+)$/;
const CORS_ORIGIN = Bun.env.CORS_ORIGIN ?? "*";

const corsHeaders = {
	"Access-Control-Allow-Origin": CORS_ORIGIN,
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
	port: Bun.env.PORT ?? 4005,
	async fetch(req) {
		const { pathname, searchParams } = new URL(req.url);

		if (req.method === "OPTIONS") {
			return new Response(null, { headers: corsHeaders });
		}

		if (pathname === "/") {
			return Response.redirect(new URL("/docs", req.url).href, 302);
		}

		if (pathname === "/health") {
			return jsonResponse({ ok: true, realm: "midgard" });
		}

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

		if (pathname === "/openapi.json") {
			const baseUrl = new URL(req.url).origin;
			return jsonResponse(getOpenApiSpec(baseUrl));
		}

		if (req.method === "GET" && pathname === "/cards") {
			const faction = searchParams.get("faction") ?? undefined;
			const element = searchParams.get("element") ?? undefined;
			const query = searchParams.get("q") ?? undefined;
			const cards = await cardsService.listCards(faction, element, query);
			return jsonResponse(cards);
		}

		if (req.method === "GET" && pathname === "/cards/stats") {
			const faction = searchParams.get("faction") ?? undefined;
			const element = searchParams.get("element") ?? undefined;
			const query = searchParams.get("q") ?? undefined;
			const cards = await cardsService.listCardsWithStats(faction, element, query);
			return jsonResponse(cards);
		}

		if (req.method === "GET" && pathname === "/cards/all") {
			const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
			const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
			const result = await cardsService.listAllCards(page, limit);
			return jsonResponse(result);
		}

		const cardMatch = pathname.match(CARD_ID_PATTERN);
		if (req.method === "GET" && cardMatch) {
			const id = cardMatch[1];
			if (!id) {
				return jsonResponse({ error: "Invalid card ID" }, 400);
			}
			const card = await cardsService.getCard(id);

			if (!card) {
				return jsonResponse({
					error: "This card was lost in Ragnarok",
					hint: "Check the ID or browse /cards"
				}, 404);
			}

			return jsonResponse(card);
		}

		return jsonResponse({
			error: "You have wandered into Niflheim",
			hint: "Check /docs for available routes"
		}, 404);
	},
});

console.log(`Server running on port ${server.port}`);
