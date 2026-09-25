// Checked in this order, so "koskenkorva salmiakki" hits Likööri before Vodka.
// A trailing * means prefix match ("glen*" matches "glenfiddich").
const TYPES = [
  ["Anislikööri", ["ouzo*", "raki", "pastis", "sambuca*", "absint*", "arak", "pernod", "ricard"]],
  ["Yrttilikööri", ["jager*", "yrtti*", "herbal", "chartreuse", "fernet*", "becherovka", "unicum", "gammel dansk", "underberg", "jaloviina*"]],
  ["Likööri", ["likoor*", "liqueur*", "baileys", "bailey", "kahlua", "amaretto", "disaronno", "cointreau", "triple sec", "limoncello", "salmiak*", "salmari*", "fisu", "fisherman*", "minttu*", "pantteri", "galliano", "malibu", "sourz", "licor 43", "aperol", "campari", "tequila rose", "fireball"]],
  ["Mezcal", ["mezcal*", "del maguey", "montelobos"]],
  ["Tequila", ["tequila*", "don julio", "patron", "jose cuervo", "cuervo", "olmeca", "espolon", "casamigos", "1800", "sierra"]],
  ["Konjakki / brandy", ["konjak*", "cognac*", "brandy*", "hennessy", "martell", "remy*", "courvoisier", "calvados", "armagnac", "metaxa", "jallu*", "grappa", "pisco"]],
  ["Viski", ["viski*", "whisky*", "whiskey*", "bourbon*", "scotch", "rye", "malt", "jameson", "jack daniel*", "jim beam", "johnnie walker", "glen*", "laphroaig", "lagavulin", "ardbeg", "macallan", "talisker", "makers mark", "bulleit", "woodford", "monkey shoulder", "chivas", "ballantine*", "famous grouse", "bushmills", "tullamore", "suntory", "nikka", "yamazaki"]],
  ["Rommi", ["rommi*", "rum", "rhum", "bacardi", "captain morgan", "havana*", "kraken", "sailor jerry", "diplomatico", "zacapa", "plantation", "cachaca", "don papa", "appleton", "bumbu"]],
  ["Gin", ["gin", "gini*", "ginii*", "napue", "kyro", "tanqueray", "bombay", "hendrick*", "beefeater", "gordon*", "monkey 47", "roku", "sipsmith", "malfy"]],
  ["Vodka", ["vodka*", "votka*", "absolut*", "koskenkorva", "kossu*", "smirnoff", "grey goose", "belvedere", "finlandia", "ketel one", "stolichnaya", "russian standard", "explorer", "danzka", "leijona"]],
];

const norm = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/['’`]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const MATCHERS = TYPES.map(([label, words]) => ({
  label,
  key: norm(label),
  re: new RegExp(words.map((w) =>
    w.endsWith("*") ? `(^| )${esc(w.slice(0, -1))}` : `(^| )${esc(w)}( |$)`
  ).join("|")),
}));

// Anything unrecognised becomes its own slot, named after what was typed.
function classify(input) {
  const n = norm(input);
  for (const m of MATCHERS) if (m.re.test(n)) return { key: m.key, label: m.label };
  const label = input.trim().slice(0, 30);
  return { key: "x " + n, label: label[0].toUpperCase() + label.slice(1) };
}

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

async function readDrink(request) {
  const body = await request.json().catch(() => ({}));
  const drink = String(body.drink ?? "").trim().replace(/\s+/g, " ");
  return drink.length >= 2 && drink.length <= 60 && norm(drink) ? drink : null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/board" && request.method === "GET") {
      const { results } = await env.DB.prepare(
        "SELECT label FROM dibs ORDER BY reserved_at"
      ).all();
      return json({ items: results });
    }

    if (url.pathname === "/api/check" && request.method === "GET") {
      const q = (url.searchParams.get("q") ?? "").trim();
      if (q.length < 2 || !norm(q)) return json({});
      const { key, label } = classify(q);
      const row = await env.DB.prepare("SELECT 1 FROM dibs WHERE category = ?").bind(key).first();
      return json({ label, taken: !!row });
    }

    if (url.pathname === "/api/dibs" && request.method === "POST") {
      const drink = await readDrink(request);
      if (!drink) return json({ error: "Kirjoita viina (2–60 merkkiä)." }, 400);
      const { key, label } = classify(drink);
      try {
        await env.DB.prepare(
          "INSERT INTO dibs (category, label, drink, reserved_at) VALUES (?, ?, ?, ?)"
        ).bind(key, label, drink, Date.now()).run();
      } catch (e) {
        if (String(e).includes("UNIQUE")) {
          return json({ error: `${label} on jo dibsattu.`, label }, 409);
        }
        throw e;
      }
      return json({ label });
    }

    if (url.pathname === "/api/undibs" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const row = await env.DB.prepare("DELETE FROM dibs WHERE label = ? RETURNING label")
        .bind(String(body.label ?? "")).first();
      if (!row) return json({ error: "Tätä dibsiä ei enää ole." }, 404);
      return json({ label: row.label });
    }

    return json({ error: "Not found" }, 404);
  },
};
