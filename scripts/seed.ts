#!/usr/bin/env bun
/**
 * Seed database from JSON file
 * Usage: DATABASE_URL="..." bun scripts/seed.ts [--file seed-data.json]
 */

import postgres from "postgres";
import type { CharacterRow, StatsRow } from "@/types";

interface SeedData {
	characters: CharacterRow[];
	cards: Array<{ art_id: string; CharacterID: string; is_main: boolean }>;
	stats: StatsRow[];
}

interface SeedReport {
	characters: { inserted: number; updated: number };
	cards: { inserted: number; updated: number };
	stats: { inserted: number; updated: number };
}

const DATABASE_URL = Bun.env.DATABASE_URL;
if (!DATABASE_URL) {
	console.error("ERROR: DATABASE_URL not defined");
	process.exit(1);
}

const fileArg = process.argv.find((arg, i) => process.argv[i - 1] === "--file");
const seedFile = fileArg ?? "seed-data.json";

async function seed(databaseUrl: string) {
	const sql = postgres(databaseUrl);
	const report: SeedReport = {
		characters: { inserted: 0, updated: 0 },
		cards: { inserted: 0, updated: 0 },
		stats: { inserted: 0, updated: 0 },
	};

	console.log(`Reading ${seedFile}...`);
	const file = Bun.file(seedFile);

	if (!(await file.exists())) {
		console.error(`ERROR: File ${seedFile} not found`);
		process.exit(1);
	}

	const data: SeedData = await file.json();

	console.log(`Found: ${data.characters.length} characters, ${data.cards.length} cards, ${data.stats.length} stats`);

	// Check connection
	console.log("\nConnecting to PostgreSQL...");
	const connectionResult = await sql<{ now: Date }[]>`SELECT NOW() as now`;
	console.log("Connected:", connectionResult[0]?.now);

	// Get existing IDs for comparison
	const existingCharacters = new Set(
		(await sql<{ CharacterID: string }[]>`SELECT "CharacterID" FROM characters`).map((r) => r.CharacterID)
	);
	const existingCards = new Set(
		(await sql<{ art_id: string }[]>`SELECT art_id FROM cards`).map((r) => r.art_id)
	);
	const existingStats = new Set(
		(await sql<{ CharacterID: string }[]>`SELECT "CharacterID" FROM stats`).map((r) => r.CharacterID)
	);

	// Insert characters
	console.log("\nProcessing characters...");
	for (const c of data.characters) {
		const isUpdate = existingCharacters.has(c.CharacterID);
		await sql`
			INSERT INTO characters ("CharacterID", "NameSlug", "FullName", "Category", "ShortDescription", "Lore", "ElementType", "ChessPiece", "Faction", "Rarity", "Link")
			VALUES (${c.CharacterID}, ${c.NameSlug}, ${c.FullName}, ${c.Category}, ${c.ShortDescription}, ${c.Lore}, ${c.ElementType}, ${c.ChessPiece}, ${c.Faction}, ${c.Rarity}, ${c.Link})
			ON CONFLICT ("CharacterID") DO UPDATE SET
				"NameSlug" = EXCLUDED."NameSlug",
				"FullName" = EXCLUDED."FullName",
				"Category" = EXCLUDED."Category",
				"ShortDescription" = EXCLUDED."ShortDescription",
				"Lore" = EXCLUDED."Lore",
				"ElementType" = EXCLUDED."ElementType",
				"ChessPiece" = EXCLUDED."ChessPiece",
				"Faction" = EXCLUDED."Faction",
				"Rarity" = EXCLUDED."Rarity",
				"Link" = EXCLUDED."Link"
		`;
		if (isUpdate) {
			report.characters.updated++;
		} else {
			report.characters.inserted++;
			existingCharacters.add(c.CharacterID);
		}
	}

	// Insert cards
	console.log("Processing cards...");
	for (const c of data.cards) {
		const isUpdate = existingCards.has(c.art_id);
		await sql`
			INSERT INTO cards (art_id, "CharacterID", is_main)
			VALUES (${c.art_id}, ${c.CharacterID}, ${c.is_main})
			ON CONFLICT (art_id) DO UPDATE SET
				"CharacterID" = EXCLUDED."CharacterID",
				is_main = EXCLUDED.is_main
		`;
		if (isUpdate) {
			report.cards.updated++;
		} else {
			report.cards.inserted++;
			existingCards.add(c.art_id);
		}
	}

	// Insert stats
	console.log("Processing stats...");
	for (const s of data.stats) {
		const isUpdate = existingStats.has(s.CharacterID);
		await sql`
			INSERT INTO stats ("CharacterID", "NameSlug", "Health", "Stamina", "Attack", "Speed", "Mana", "Weight")
			VALUES (${s.CharacterID}, ${s.NameSlug}, ${s.Health}, ${s.Stamina}, ${s.Attack}, ${s.Speed}, ${s.Mana}, ${s.Weight})
			ON CONFLICT ("CharacterID") DO UPDATE SET
				"NameSlug" = EXCLUDED."NameSlug",
				"Health" = EXCLUDED."Health",
				"Stamina" = EXCLUDED."Stamina",
				"Attack" = EXCLUDED."Attack",
				"Speed" = EXCLUDED."Speed",
				"Mana" = EXCLUDED."Mana",
				"Weight" = EXCLUDED."Weight"
		`;
		if (isUpdate) {
			report.stats.updated++;
		} else {
			report.stats.inserted++;
			existingStats.add(s.CharacterID);
		}
	}

	// Final counts
	const countsResult = await sql<{ characters: string; cards: string; stats: string }[]>`
		SELECT
			(SELECT COUNT(*) FROM characters) as characters,
			(SELECT COUNT(*) FROM cards) as cards,
			(SELECT COUNT(*) FROM stats) as stats
	`;
	const finalCounts = countsResult[0] ?? { characters: "0", cards: "0", stats: "0" };

	await sql.end();

	// Print report
	console.log("\n" + "=".repeat(50));
	console.log("                   SEED REPORT");
	console.log("=".repeat(50));
	console.log("");
	console.log("  Table        Inserted    Updated    Total");
	console.log("  " + "-".repeat(46));
	console.log(`  Characters   ${String(report.characters.inserted).padStart(8)}   ${String(report.characters.updated).padStart(8)}   ${String(finalCounts.characters).padStart(6)}`);
	console.log(`  Cards        ${String(report.cards.inserted).padStart(8)}   ${String(report.cards.updated).padStart(8)}   ${String(finalCounts.cards).padStart(6)}`);
	console.log(`  Stats        ${String(report.stats.inserted).padStart(8)}   ${String(report.stats.updated).padStart(8)}   ${String(finalCounts.stats).padStart(6)}`);
	console.log("");
	console.log("=".repeat(50));

	const totalInserted = report.characters.inserted + report.cards.inserted + report.stats.inserted;
	const totalUpdated = report.characters.updated + report.cards.updated + report.stats.updated;

	if (totalInserted > 0 && totalUpdated === 0) {
		console.log(`  All ${totalInserted} records inserted successfully`);
	} else if (totalInserted === 0 && totalUpdated > 0) {
		console.log(`  All ${totalUpdated} records updated (no new data)`);
	} else if (totalInserted > 0 && totalUpdated > 0) {
		console.log(`  ${totalInserted} new records, ${totalUpdated} updated`);
	} else {
		console.log("  No changes made");
	}
	console.log("=".repeat(50));
}

seed(DATABASE_URL).catch((err) => {
	console.error("Error:", err.message);
	process.exit(1);
});
