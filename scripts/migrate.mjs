// Applies pending SQL migrations from db/migrations, in file-name order.
//
//   npm run db:migrate             # uses DATABASE_URL (from .env.local if present)
//
// Each file runs in its own transaction and is recorded in
// public.schema_migrations, so it runs only once. Applied migrations must not
// be edited: add a new file instead (the checksum check enforces this).

import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import pg from "pg";

const root = path.resolve(import.meta.dirname, "..");
const migrationsDir = path.join(root, "db", "migrations");
dotenv.config({ path: path.join(root, ".env.local"), quiet: true });

if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set (export it or add it to .env.local).");
    process.exit(1);
}

const files = readdirSync(migrationsDir)
    .filter((f) => /^\d+_.+\.sql$/.test(f))
    .sort();

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
    // Serialize concurrent runs (e.g. two deploys at once).
    await client.query("SELECT pg_advisory_lock(hashtext('avarag_schema_migrations'))");
    await client.query(`
        CREATE TABLE IF NOT EXISTS public.schema_migrations (
            version text PRIMARY KEY,
            checksum text NOT NULL,
            applied_at timestamptz NOT NULL DEFAULT now()
        )`);

    const applied = new Map(
        (await client.query("SELECT version, checksum FROM public.schema_migrations")).rows.map(
            (r) => [r.version, r.checksum]
        )
    );

    let count = 0;
    for (const file of files) {
        const sql = readFileSync(path.join(migrationsDir, file), "utf8");
        const checksum = createHash("sha256").update(sql).digest("hex");

        if (applied.has(file)) {
            if (applied.get(file) !== checksum) {
                throw new Error(`${file} was changed after being applied. Create a new migration instead.`);
            }
            continue;
        }

        process.stdout.write(`Applying ${file}... `);
        await client.query("BEGIN");
        try {
            await client.query(sql);
            await client.query(
                "INSERT INTO public.schema_migrations (version, checksum) VALUES ($1, $2)",
                [file, checksum]
            );
            await client.query("COMMIT");
        } catch (error) {
            await client.query("ROLLBACK");
            console.log("failed");
            throw error;
        }
        console.log("done");
        count++;
    }

    console.log(count ? `${count} migration(s) applied.` : "Database is up to date.");
} catch (error) {
    console.error(error.message ?? error);
    process.exitCode = 1;
} finally {
    await client.end();
}
