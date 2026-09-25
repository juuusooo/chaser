import { sql } from "../lib/db.js";
import { classify, norm } from "../lib/classify.js";

export default async function handler(req, res) {
  res.setHeader("cache-control", "no-store");
  const q = String(req.query.q ?? "").trim();
  if (q.length < 2 || !norm(q)) return res.json({});
  const { key, label } = classify(q);
  const rows = await sql`SELECT 1 FROM dibs WHERE category = ${key}`;
  res.json({ label, taken: rows.length > 0 });
}
