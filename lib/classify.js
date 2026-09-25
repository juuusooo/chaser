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

export const norm = (s) =>
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
export function classify(input) {
  const n = norm(input);
  for (const m of MATCHERS) if (m.re.test(n)) return { key: m.key, label: m.label };
  const label = input.trim().slice(0, 30);
  return { key: "x " + n, label: label[0].toUpperCase() + label.slice(1) };
}
