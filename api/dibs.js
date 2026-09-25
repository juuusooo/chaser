import { updateDibs } from "../lib/store.js";
import { classify, norm } from "../lib/classify.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const drink = String(req.body?.drink ?? "").trim().replace(/\s+/g, " ");
  if (drink.length < 2 || drink.length > 60 || !norm(drink)) {
    return res.status(400).json({ error: "Kirjoita viina (2–60 merkkiä)." });
  }
  const { key, label } = classify(drink);
  let taken = false;
  await updateDibs((items) => {
    taken = items.some((i) => i.category === key);
    return taken ? null : [...items, { category: key, label, drink, reservedAt: Date.now() }];
  });
  if (taken) return res.status(409).json({ error: `${label} on jo dibsattu.`, label });
  res.json({ label });
}
