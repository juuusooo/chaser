import { sql } from "../lib/db.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const rows = await sql`DELETE FROM dibs WHERE label = ${String(req.body?.label ?? "")} RETURNING label`;
  if (!rows.length) return res.status(404).json({ error: "Tätä dibsiä ei enää ole." });
  res.json({ label: rows[0].label });
}
