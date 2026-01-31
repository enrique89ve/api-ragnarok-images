#!/usr/bin/env bun
/**
 * Validate database integrity and data types
 * Usage: DATABASE_URL="..." bun scripts/validate.ts
 */

import postgres from "postgres";
import { FACTIONS, ELEMENTS, RARITIES } from "@/types";

const DATABASE_URL = Bun.env.DATABASE_URL;
if (!DATABASE_URL) {
	console.error("ERROR: DATABASE_URL not defined");
	process.exit(1);
}

interface ValidationResult {
	check: string;
	status: "OK" | "FAIL" | "WARN";
	message: string;
}

async function validate(databaseUrl: string) {
	const sql = postgres(databaseUrl);
	const results: ValidationResult[] = [];

	console.log("Validating database integrity...\n");

	// 1. Connection check
	try {
		await sql`SELECT 1`;
		results.push({ check: "Connection", status: "OK", message: "Connected to PostgreSQL" });
	} catch (e) {
		results.push({ check: "Connection", status: "FAIL", message: `Cannot connect: ${e}` });
		printResults(results);
		process.exit(1);
	}

	// 2. Tables exist
	const tables = await sql<{ tablename: string }[]>`
		SELECT tablename FROM pg_tables WHERE schemaname = 'public'
	`;
	const tableNames = tables.map((t) => t.tablename);
	const requiredTables = ["characters", "cards", "stats"];

	for (const table of requiredTables) {
		if (tableNames.includes(table)) {
			results.push({ check: `Table: ${table}`, status: "OK", message: "Exists" });
		} else {
			results.push({ check: `Table: ${table}`, status: "FAIL", message: "Missing" });
		}
	}

	// 3. Record counts
	const countsResult = await sql<{ characters: string; cards: string; stats: string }[]>`
		SELECT
			(SELECT COUNT(*) FROM characters) as characters,
			(SELECT COUNT(*) FROM cards) as cards,
			(SELECT COUNT(*) FROM stats) as stats
	`;
	const counts = countsResult[0] ?? { characters: "0", cards: "0", stats: "0" };

	results.push({
		check: "Characters count",
		status: Number(counts.characters) > 0 ? "OK" : "WARN",
		message: `${counts.characters} records`,
	});
	results.push({
		check: "Cards count",
		status: Number(counts.cards) > 0 ? "OK" : "WARN",
		message: `${counts.cards} records`,
	});
	results.push({
		check: "Stats count",
		status: Number(counts.stats) > 0 ? "OK" : "WARN",
		message: `${counts.stats} records`,
	});

	// 4. Referential integrity - cards -> characters
	const orphanCards = await sql`
		SELECT c.art_id FROM cards c
		LEFT JOIN characters ch ON c."CharacterID" = ch."CharacterID"
		WHERE ch."CharacterID" IS NULL
	`;
	results.push({
		check: "Cards -> Characters FK",
		status: orphanCards.length === 0 ? "OK" : "FAIL",
		message: orphanCards.length === 0 ? "All cards have valid characters" : `${orphanCards.length} orphan cards`,
	});

	// 5. Referential integrity - stats -> characters
	const orphanStats = await sql`
		SELECT s."CharacterID" FROM stats s
		LEFT JOIN characters ch ON s."CharacterID" = ch."CharacterID"
		WHERE ch."CharacterID" IS NULL
	`;
	results.push({
		check: "Stats -> Characters FK",
		status: orphanStats.length === 0 ? "OK" : "FAIL",
		message: orphanStats.length === 0 ? "All stats have valid characters" : `${orphanStats.length} orphan stats`,
	});

	// 6. Data type validations - characters
	const invalidCharacters = await sql`
		SELECT "CharacterID" FROM characters
		WHERE "CharacterID" IS NULL
		   OR "NameSlug" IS NULL
		   OR "FullName" IS NULL
	`;
	results.push({
		check: "Characters required fields",
		status: invalidCharacters.length === 0 ? "OK" : "FAIL",
		message: invalidCharacters.length === 0 ? "All required fields present" : `${invalidCharacters.length} invalid`,
	});

	// 7. Data type validations - cards
	const invalidCards = await sql`
		SELECT art_id FROM cards
		WHERE art_id IS NULL
		   OR "CharacterID" IS NULL
	`;
	results.push({
		check: "Cards required fields",
		status: invalidCards.length === 0 ? "OK" : "FAIL",
		message: invalidCards.length === 0 ? "All required fields present" : `${invalidCards.length} invalid`,
	});

	// 8. Each character has at least one card
	const charactersWithoutCards = await sql`
		SELECT ch."CharacterID", ch."FullName" FROM characters ch
		LEFT JOIN cards c ON ch."CharacterID" = c."CharacterID"
		WHERE c.art_id IS NULL
	`;
	results.push({
		check: "Characters have cards",
		status: charactersWithoutCards.length === 0 ? "OK" : "WARN",
		message:
			charactersWithoutCards.length === 0
				? "All characters have at least one card"
				: `${charactersWithoutCards.length} characters without cards`,
	});

	// 9. Main art validation - each character should have exactly one main art
	const mainArtIssues = await sql`
		SELECT ch."CharacterID", ch."FullName", COUNT(c.art_id) FILTER (WHERE c.is_main = true) as main_count
		FROM characters ch
		LEFT JOIN cards c ON ch."CharacterID" = c."CharacterID"
		GROUP BY ch."CharacterID", ch."FullName"
		HAVING COUNT(c.art_id) FILTER (WHERE c.is_main = true) != 1
	`;
	results.push({
		check: "Main art per character",
		status: mainArtIssues.length === 0 ? "OK" : "WARN",
		message:
			mainArtIssues.length === 0
				? "Each character has exactly one main art"
				: `${mainArtIssues.length} characters with main art issues`,
	});

	// 10. Valid enum values - using centralized constants from types.ts
	const invalidFactions = await sql`
		SELECT DISTINCT "Faction" FROM characters
		WHERE "Faction" IS NOT NULL
		  AND "Faction" NOT IN ${sql(FACTIONS as unknown as string[])}
	`;
	results.push({
		check: "Valid factions",
		status: invalidFactions.length === 0 ? "OK" : "WARN",
		message:
			invalidFactions.length === 0
				? "All factions are valid"
				: `Unknown factions: ${invalidFactions.map((r) => r.Faction).join(", ")}`,
	});

	const invalidElements = await sql`
		SELECT DISTINCT "ElementType" FROM characters
		WHERE "ElementType" IS NOT NULL
		  AND "ElementType" NOT IN ${sql(ELEMENTS as unknown as string[])}
	`;
	results.push({
		check: "Valid elements",
		status: invalidElements.length === 0 ? "OK" : "WARN",
		message:
			invalidElements.length === 0
				? "All elements are valid"
				: `Unknown elements: ${invalidElements.map((r) => r.ElementType).join(", ")}`,
	});

	const invalidRarities = await sql`
		SELECT DISTINCT "Rarity" FROM characters
		WHERE "Rarity" IS NOT NULL
		  AND "Rarity" NOT IN ${sql(RARITIES as unknown as string[])}
	`;
	results.push({
		check: "Valid rarities",
		status: invalidRarities.length === 0 ? "OK" : "WARN",
		message:
			invalidRarities.length === 0
				? "All rarities are valid"
				: `Unknown rarities: ${invalidRarities.map((r) => r.Rarity).join(", ")}`,
	});

	await sql.end();

	printResults(results);

	const failed = results.filter((r) => r.status === "FAIL").length;
	if (failed > 0) {
		console.log(`\n${failed} validation(s) failed!`);
		process.exit(1);
	}

	console.log("\nAll validations passed!");
}

function printResults(results: ValidationResult[]) {
	const maxCheck = Math.max(...results.map((r) => r.check.length));

	for (const r of results) {
		const icon = r.status === "OK" ? "✓" : r.status === "WARN" ? "⚠" : "✗";
		const color = r.status === "OK" ? "\x1b[32m" : r.status === "WARN" ? "\x1b[33m" : "\x1b[31m";
		const reset = "\x1b[0m";
		console.log(`${color}${icon}${reset} ${r.check.padEnd(maxCheck)} : ${r.message}`);
	}
}

validate(DATABASE_URL).catch((err) => {
	console.error("Error:", err.message);
	process.exit(1);
});
