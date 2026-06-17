import pg from "pg";
import { env } from "../config/env.js";
export const pool = new pg.Pool({
    connectionString: env.DATABASE_URL,
});
export async function query(text, params = []) {
    const result = await pool.query(text, params);
    return result;
}
