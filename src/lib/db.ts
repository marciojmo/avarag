import { Pool } from "pg";

// Reused across requests (and hot reloads in dev).
const globalForPg = globalThis as unknown as { pgPool?: Pool };
const pool = (globalForPg.pgPool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: Number(process.env.PG_POOL_MAX ?? 5),
}));

export function query(text: string, params?: unknown[]) {
    return pool.query(text, params);
}

export type User = { id: string; email: string; name: string | null };

export async function getUserByEmail(email: string): Promise<User | null> {
    const result = await query(
        "SELECT id, email, name FROM public.users WHERE email = $1",
        [email]
    );
    return result.rows[0] ?? null;
}

/** Creates the user on first sign-in; no-op if it already exists. */
export async function ensureUser(email: string, name: string): Promise<void> {
    await query(
        `INSERT INTO public.users (email, name) VALUES ($1, $2)
         ON CONFLICT (email) DO NOTHING`,
        [email, name]
    );
}
