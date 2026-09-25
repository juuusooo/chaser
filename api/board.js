import { readDibs } from "../lib/store.js";

export default async function handler(req, res) {
  const { items } = await readDibs();
  res.setHeader("cache-control", "no-store");
  res.json({ items: items.map((i) => ({ label: i.label })) });
}
