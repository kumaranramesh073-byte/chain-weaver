import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Panel, Pill, Empty } from "@/components/ui-bits";
import {
  currentUserQuery,
  profilesQuery,
  skillsQuery,
  goalsQuery,
  toMembers,
  initials,
} from "@/lib/data";
import { findChains, type Chain } from "@/lib/chains";

export const Route = createFileRoute("/_authenticated/chains")({
  head: () => ({
    meta: [
      { title: "Multi-party skill chains — SkillSwap" },
      {
        name: "description",
        content:
          "Closed swap loops across the community: you teach one member, they teach the next, and the circle comes back to you.",
      },
      { property: "og:title", content: "Multi-party skill chains — SkillSwap" },
      {
        property: "og:description",
        content: "See the circular skill trades that make everyone's swap work at once.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChainsPage,
});

function ChainsPage() {
  const { data: user } = useQuery(currentUserQuery);
  const { data: profiles = [] } = useQuery(profilesQuery);
  const { data: skills = [] } = useQuery(skillsQuery);

  const members = toMembers(profiles, skills);
  const chains = findChains(members);
  const mine = chains.filter((c) => c.members.some((m) => m.id === user?.id));
  const others = chains.filter((c) => !c.members.some((m) => m.id === user?.id));

  return (
    <AppShell title="Skill chains" subtitle="Closed loops where everybody teaches and learns">
      {chains.length === 0 ? (
        <Empty
          title="No chains found yet"
          body="A chain needs members whose skills line up in a circle. Add more skills, or invite people to join the community."
        />
      ) : (
        <div className="space-y-8">
          <Group title={`Chains you're in (${mine.length})`} chains={mine} youId={user?.id} />
          <Group
            title={`Other chains in the community (${others.length})`}
            chains={others}
            youId={user?.id}
          />
        </div>
      )}

      <p className="mt-8 text-sm text-muted-foreground">
        Want more options?{" "}
        <Link to="/discover" className="font-semibold text-primary hover:underline">
          Browse the community
        </Link>
        .
      </p>
    </AppShell>
  );
}

function Group({
  title,
  chains,
  youId,
}: {
  title: string;
  chains: Chain[];
  youId: string | undefined;
}) {
  if (chains.length === 0) return null;
  return (
    <section>
      <h2 className="mb-4 font-display text-lg font-bold">{title}</h2>
      <div className="grid gap-6 xl:grid-cols-2">
        {chains.map((chain) => (
          <Panel key={chain.key}>
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <ChainCircle chain={chain} youId={youId} />
              <div className="w-full space-y-2">
                <p className="text-sm font-semibold">
                  {chain.members.length}-person loop
                </p>
                {chain.links.map((link, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border px-3 py-2 text-sm"
                  >
                    <span className={link.from.id === youId ? "font-bold text-primary" : ""}>
                      {link.from.id === youId ? "You" : link.from.display_name}
                    </span>{" "}
                    teach{link.from.id === youId ? "" : "es"}{" "}
                    <span className={link.to.id === youId ? "font-bold text-primary" : ""}>
                      {link.to.id === youId ? "you" : link.to.display_name}
                    </span>{" "}
                    <Pill tone="teach">{link.skill}</Pill>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </section>
  );
}

function ChainCircle({ chain, youId }: { chain: Chain; youId: string | undefined }) {
  const size = 200;
  const r = 72;
  const c = size / 2;
  const n = chain.members.length;
  const pts = chain.members.map((m, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    return { m, x: c + r * Math.cos(angle), y: c + r * Math.sin(angle) };
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0"
      role="img"
      aria-label={`Chain of ${n} members`}
    >
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 z" fill="var(--primary)" />
        </marker>
      </defs>
      <circle cx={c} cy={c} r={r} fill="none" stroke="var(--border)" strokeDasharray="4 5" />
      {pts.map((p, i) => {
        const next = pts[(i + 1) % n]!;
        const dx = next.x - p.x;
        const dy = next.y - p.y;
        const len = Math.hypot(dx, dy) || 1;
        const pad = 22;
        return (
          <line
            key={i}
            x1={p.x + (dx / len) * pad}
            y1={p.y + (dy / len) * pad}
            x2={next.x - (dx / len) * pad}
            y2={next.y - (dy / len) * pad}
            stroke="var(--primary)"
            strokeWidth={1.6}
            markerEnd="url(#arrow)"
            opacity={0.75}
          />
        );
      })}
      {pts.map(({ m, x, y }) => (
        <g key={m.id}>
          <circle
            cx={x}
            cy={y}
            r={19}
            fill={m.id === youId ? "var(--primary)" : "var(--accent)"}
            stroke="var(--primary)"
            strokeWidth={1.5}
          />
          <text
            x={x}
            y={y + 4}
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            fill={m.id === youId ? "var(--primary-foreground)" : "var(--accent-foreground)"}
          >
            {m.id === youId ? "You" : initials(m.display_name)}
          </text>
        </g>
      ))}
    </svg>
  );
}
