export type Member = {
  id: string;
  display_name: string;
  teaches: string[];
  wants: string[];
};

export type ChainLink = {
  from: Member;
  to: Member;
  skill: string;
};

export type Chain = {
  key: string;
  members: Member[];
  links: ChainLink[];
};

const ALIASES: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  reactjs: "react",
  nodejs: "node",
  py: "python",
  photoshop: "adobe photoshop",
  ui: "ui design",
  ux: "ux design",
};

const FILLER = new Set([
  "basic",
  "basics",
  "beginner",
  "intro",
  "introduction",
  "advanced",
  "the",
  "a",
  "an",
  "of",
  "for",
  "to",
  "and",
  "with",
  "in",
  "learn",
  "learning",
  "lessons",
  "course",
  "skill",
  "skills",
]);

/** "React.js  Basics" -> ["react"] */
function tokens(raw: string): string[] {
  const cleaned = (ALIASES[raw.trim().toLowerCase().replace(/[^a-z0-9]/g, "")] ?? raw)
    .toLowerCase()
    .replace(/[^a-z0-9+#\s]/g, " ");

  return cleaned
    .split(/\s+/)
    .map((w) => ALIASES[w] ?? w)
    .flatMap((w) => w.split(/\s+/))
    .map((w) => (w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w))
    .filter((w) => w && !FILLER.has(w));
}

/** True when two free-text skill names mean the same thing. */
export function sameSkill(a: string, b: string): boolean {
  const ta = tokens(a);
  const tb = tokens(b);
  if (!ta.length || !tb.length) return false;

  const sa = new Set(ta);
  const sb = new Set(tb);
  const shared = [...sa].filter((w) => sb.has(w)).length;
  if (shared === 0) return false;

  // every word of the shorter name appears in the longer one
  return shared === Math.min(sa.size, sb.size);
}

/** Skill that `from` can teach `to`, if any. */
export function matchSkill(from: Member, to: Member): string | null {
  for (const skill of from.teaches) {
    if (!skill.trim()) continue;
    if (to.wants.some((want) => want.trim() && sameSkill(skill, want))) return skill.trim();
  }
  return null;
}


function canonicalKey(ids: string[]): string {
  // rotate so the smallest id comes first — same loop = same key
  let best = 0;
  for (let i = 1; i < ids.length; i++) if (ids[i]! < ids[best]!) best = i;
  return [...ids.slice(best), ...ids.slice(0, best)].join(">");
}

/**
 * Finds closed swap loops: everyone in the loop teaches the next person
 * something they want, and the last person closes the circle.
 */
export function findChains(members: Member[], maxLength = 6): Chain[] {
  const usable = members.filter(
    (m) => m.teaches.some((s) => s.trim()) && m.wants.some((s) => s.trim()),
  );

  const edges = new Map<string, { to: Member; skill: string }[]>();
  for (const a of usable) {
    const list: { to: Member; skill: string }[] = [];
    for (const b of usable) {
      if (a.id === b.id) continue;
      const skill = matchSkill(a, b);
      if (skill) list.push({ to: b, skill });
    }
    edges.set(a.id, list);
  }

  const found = new Map<string, Chain>();

  const walk = (start: Member, path: Member[], skills: string[]) => {
    if (found.size >= 30) return;
    const current = path[path.length - 1]!;
    for (const edge of edges.get(current.id) ?? []) {
      if (edge.to.id === start.id) {
        if (path.length >= 2) {
          const ids = path.map((m) => m.id);
          const key = canonicalKey(ids);
          if (!found.has(key)) {
            const allSkills = [...skills, edge.skill];
            found.set(key, {
              key,
              members: [...path],
              links: path.map((m, i) => ({
                from: m,
                to: path[(i + 1) % path.length]!,
                skill: allSkills[i]!,
              })),
            });
          }
        }
        continue;
      }
      if (path.some((m) => m.id === edge.to.id)) continue;
      if (path.length >= maxLength) continue;
      walk(start, [...path, edge.to], [...skills, edge.skill]);
    }
  };

  for (const m of usable) walk(m, [m], []);

  return [...found.values()].sort((a, b) => a.members.length - b.members.length);
}
