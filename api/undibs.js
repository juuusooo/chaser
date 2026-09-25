import { updateDibs } from "../lib/store.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const label = String(req.body?.label ?? "");
  let found = false;
  await updateDibs((items) => {
    found = items.some((i) => i.label === label);
    return found ? items.filter((i) => i.label !== label) : null;
  });
  if (!found) return res.status(404).json({ error: "Tätä dibsiä ei enää ole." });
  res.json({ label });
}
