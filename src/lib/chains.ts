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

const norm = (s: string) => s.trim().toLowerCase();

/** Skill that `from` can teach `to`, if any. */
export function matchSkill(from: Member, to: Member): string | null {
  const wanted = new Set(to.wants.map(norm).filter(Boolean));
  for (const skill of from.teaches) {
    if (skill.trim() && wanted.has(norm(skill))) return skill.trim();
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
