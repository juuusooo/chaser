import { sql } from "../lib/db.js";

export default async function handler(req, res) {
  const items = await sql`SELECT label FROM dibs ORDER BY reserved_at`;
  res.setHeader("cache-control", "no-store");
  res.json({ items });
}
