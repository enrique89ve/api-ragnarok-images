#!/usr/bin/env bun
/**
 * Execute schema.sql and data.sql in PostgreSQL
 * Usage: DATABASE_URL="..." bun scripts/setup-db.ts
 */

import postgres from "postgres";

const DATABASE_URL = Bun.env.DATABASE_URL;

if (!DATABASE_URL) {
	console.error("ERROR: DATABASE_URL not defined");
	process.exit(1);
}

async function run(databaseUrl: string) {
	const sql = postgres(databaseUrl);

	console.log("Connecting to PostgreSQL...");

	// Verify connection
	const connectionResult = await sql<{ now: Date }[]>`SELECT NOW() as now`;
	console.log("Connected:", connectionResult[0]?.now);

	// Read and execute schema.sql
	console.log("\nExecuting schema.sql...");
	const schema = await Bun.file("schema.sql").text();
	await sql.unsafe(schema);
	console.log("Schema created");

	// Read and execute data.sql
	console.log("\nExecuting data.sql...");
	const data = await Bun.file("data.sql").text();
	await sql.unsafe(data);
	console.log("Data imported");

	// Verify
	const countsResult = await sql<{ characters: string; cards: string; stats: string }[]>`
		SELECT
			(SELECT COUNT(*) FROM characters) as characters,
			(SELECT COUNT(*) FROM cards) as cards,
			(SELECT COUNT(*) FROM stats) as stats
	`;
	const counts = countsResult[0] ?? { characters: "0", cards: "0", stats: "0" };
	console.log("\nVerification:");
	console.log(`  Characters: ${counts.characters}`);
	console.log(`  Cards: ${counts.cards}`);
	console.log(`  Stats: ${counts.stats}`);

	await sql.end();
	console.log("\nDone!");
}

run(DATABASE_URL).catch((err) => {
	console.error("Error:", err.message);
	process.exit(1);
});
