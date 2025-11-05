// lib/db.ts
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Generic query function for direct SQL queries
export async function query(text: string, params?: any[]) {
    const client = await pool.connect();
    try {
        return await client.query(text, params);
    } finally {
        client.release();
    }
}

export async function createUser(email: string, name: string) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Create user
        const userResult = await client.query(
            'INSERT INTO public.users (email, name) VALUES ($1, $2) RETURNING id',
            [email, name]
        );
        const userId = userResult.rows[0].id;

        // Create default agent for the user
        const agentResult = await client.query(
            'INSERT INTO public.agents (user_id, name, description) VALUES ($1, $2, $3) RETURNING id',
            [userId, 'Default Agent', 'Your personal AI assistant']
        );
        const agentId = agentResult.rows[0].id;

        await client.query('COMMIT');

        return { userId, agentId };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

export async function getUserByEmail(email: string) {
    const client = await pool.connect();
    try {
        const result = await client.query(
            'SELECT id, email, name FROM public.users WHERE email = $1',
            [email]
        );
        return result.rows[0] || null;
    } finally {
        client.release();
    }
}

export async function getUserAgents(userId: string) {
    const client = await pool.connect();
    try {
        const result = await client.query(
            'SELECT id, name, description, model FROM public.agents WHERE user_id = $1 ORDER BY created_at',
            [userId]
        );
        return result.rows;
    } finally {
        client.release();
    }
}
