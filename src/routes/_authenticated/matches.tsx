import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Panel, Pill, Empty } from "@/components/ui-bits";
import { currentUserQuery, profilesQuery, skillsQuery, toMembers, initials } from "@/lib/data";
import { matchSkill } from "@/lib/chains";

export const Route = createFileRoute("/_authenticated/matches")({
  head: () => ({
    meta: [
      { title: "Direct matches — SkillSwap" },
      {
        name: "description",
        content: "One-to-one reciprocal swaps: people who teach what you want and want what you teach.",
      },
      { property: "og:title", content: "Direct matches — SkillSwap" },
      {
        property: "og:description",
        content: "Find the members you can trade skills with straight away.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MatchesPage,
});

function MatchesPage() {
  const { data: user } = useQuery(currentUserQuery);
  const { data: profiles = [] } = useQuery(profilesQuery);
  const { data: skills = [] } = useQuery(skillsQuery);

  const members = toMembers(profiles, skills);
  const me = members.find((m) => m.id === user?.id);

  const matches = me
    ? members
        .filter((m) => m.id !== me.id)
        .map((m) => ({
          member: m,
          theyTeach: matchSkill(m, me),
          youTeach: matchSkill(me, m),
        }))
        .filter((m) => m.theyTeach && m.youTeach)
    : [];

  return (
    <AppShell title="Direct matches" subtitle="Straight one-to-one skill swaps">
      {matches.length === 0 ? (
        <Empty
          title="No direct matches yet"
          body="Add more skills you teach and want to learn — or check Skill chains, where a swap can work through three or more people."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {matches.map(({ member, theyTeach, youTeach }) => (
            <Panel key={member.id}>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {initials(member.display_name)}
                </span>
                <div>
                  <p className="font-semibold">{member.display_name}</p>
                  <p className="text-xs text-muted-foreground">Perfect reciprocal match</p>
                </div>
              </div>

              <div className="mt-5 space-y-2 rounded-2xl bg-accent/50 p-4 text-sm">
                <p className="flex items-center gap-2">
                  <ArrowLeftRight className="h-4 w-4 text-primary" />
                  They teach you <Pill tone="teach">{theyTeach}</Pill>
                </p>
                <p className="flex items-center gap-2">
                  <ArrowLeftRight className="h-4 w-4 text-primary" />
                  You teach them <Pill tone="learn">{youTeach}</Pill>
                </p>
              </div>

              <div className="mt-4 flex gap-3">
                <Link
                  to="/messages"
                  search={{ to: member.id }}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Message
                </Link>
                <Link
                  to="/discover"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
                >
                  View in Discover
                </Link>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </AppShell>
  );
}
