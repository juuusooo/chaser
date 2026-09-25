import { readDibs } from "../lib/store.js";
import { classify, norm } from "../lib/classify.js";

export default async function handler(req, res) {
  res.setHeader("cache-control", "no-store");
  const q = String(req.query.q ?? "").trim();
  if (q.length < 2 || !norm(q)) return res.json({});
  const { key, label } = classify(q);
  const { items } = await readDibs();
  res.json({ label, taken: items.some((i) => i.category === key) });
}
