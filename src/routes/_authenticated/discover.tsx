import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Panel, Pill, Empty, inputClass } from "@/components/ui-bits";
import { currentUserQuery, profilesQuery, skillsQuery, initials } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/discover")({
  head: () => ({
    meta: [
      { title: "Discover members — SkillSwap" },
      {
        name: "description",
        content: "Browse everyone in the community, what they teach and what they want to learn.",
      },
      { property: "og:title", content: "Discover members — SkillSwap" },
      {
        property: "og:description",
        content: "A filterable directory of the whole SkillSwap community.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DiscoverPage,
});

function DiscoverPage() {
  const { data: user } = useQuery(currentUserQuery);
  const { data: profiles = [] } = useQuery(profilesQuery);
  const { data: skills = [] } = useQuery(skillsQuery);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "teach" | "learn">("all");

  const term = q.trim().toLowerCase();

  const rows = profiles
    .filter((p) => p.id !== user?.id)
    .map((p) => ({
      profile: p,
      teaches: skills.filter((s) => s.user_id === p.id && s.kind === "teach"),
      wants: skills.filter((s) => s.user_id === p.id && s.kind === "learn"),
    }))
    .filter(({ profile, teaches, wants }) => {
      if (!term) return true;
      const pool = [
        profile.display_name,
        profile.headline,
        profile.location,
        ...(filter !== "learn" ? teaches.map((s) => s.name) : []),
        ...(filter !== "teach" ? wants.map((s) => s.name) : []),
      ];
      return pool.join(" ").toLowerCase().includes(term);
    });

  return (
    <AppShell title="Discover" subtitle="Everyone in the community">
      <div className="mb-6 flex flex-wrap gap-3">
        <input
          className={`${inputClass} max-w-sm`}
          placeholder="Search name, skill or place"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="flex gap-1 rounded-full border border-border p-1">
          {(["all", "teach", "learn"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              {f === "all" ? "All skills" : f === "teach" ? "Teaches" : "Wants to learn"}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <Empty
          title="No members match"
          body="Try a different search, or invite a friend to join so the community grows."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ profile, teaches, wants }) => (
            <Panel key={profile.id}>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {initials(profile.display_name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{profile.display_name || "Member"}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {profile.headline || profile.location || "SkillSwap member"}
                  </p>
                </div>
              </div>

              {profile.bio ? (
                <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{profile.bio}</p>
              ) : null}

              <div className="mt-4 space-y-2">
                <SkillRow label="Teaches" items={teaches.map((s) => s.name)} tone="teach" />
                <SkillRow label="Wants" items={wants.map((s) => s.name)} tone="learn" />
              </div>

              <Link
                to="/messages"
                search={{ to: profile.id }}
                className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline"
              >
                Message {profile.display_name?.split(" ")[0] || "member"}
              </Link>
            </Panel>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function SkillRow({
  label,
  items,
  tone,
}: {
  label: string;
  items: string[];
  tone: "teach" | "learn";
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {items.length ? (
          items.map((s) => (
            <Pill key={s} tone={tone}>
              {s}
            </Pill>
          ))
        ) : (
          <span className="text-xs text-muted-foreground">Nothing listed</span>
        )}
      </div>
    </div>
  );
}
