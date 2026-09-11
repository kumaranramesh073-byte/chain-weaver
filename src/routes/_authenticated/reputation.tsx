import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, Award, ShieldCheck, Flame, Users2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import {
  Panel,
  SectionTitle,
  Pill,
  Stat,
  Empty,
  inputClass,
  btnPrimary,
} from "@/components/ui-bits";
import {
  currentUserQuery,
  profilesQuery,
  reviewsQuery,
  skillsQuery,
  projectMembersQuery,
  toMembers,
  initials,
} from "@/lib/data";
import { findChains } from "@/lib/chains";

export const Route = createFileRoute("/_authenticated/reputation")({
  head: () => ({
    meta: [
      { title: "Reputation & skill score — SkillSwap" },
      {
        name: "description",
        content: "Your trust rating, badges and the reviews trade partners have left you.",
      },
      { property: "og:title", content: "Reputation & skill score — SkillSwap" },
      {
        property: "og:description",
        content: "Badges, trust rating and trade reviews across the community.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReputationPage,
});

function ReputationPage() {
  const qc = useQueryClient();
  const { data: user } = useQuery(currentUserQuery);
  const { data: profiles = [] } = useQuery(profilesQuery);
  const { data: reviews = [] } = useQuery(reviewsQuery);
  const { data: skills = [] } = useQuery(skillsQuery);
  const { data: memberships = [] } = useQuery(projectMembersQuery);

  const aboutMe = reviews.filter((r) => r.subject_id === user?.id);
  const avg = aboutMe.length
    ? aboutMe.reduce((s, r) => s + r.rating, 0) / aboutMe.length
    : 0;

  const mySkills = skills.filter((s) => s.user_id === user?.id);
  const chains = findChains(toMembers(profiles, skills));
  const myChains = chains.filter((c) => c.members.some((m) => m.id === user?.id));
  const myProjects = memberships.filter((m) => m.user_id === user?.id);

  const score = Math.min(
    100,
    mySkills.length * 6 + aboutMe.length * 10 + myChains.length * 8 + myProjects.length * 5,
  );

  const badges = [
    {
      icon: ShieldCheck,
      label: "Verified member",
      earned: true,
      hint: "Signed in with a confirmed account",
    },
    {
      icon: Flame,
      label: "Skill sharer",
      earned: mySkills.filter((s) => s.kind === "teach").length >= 3,
      hint: "List 3 skills you can teach",
    },
    {
      icon: Users2,
      label: "Chain builder",
      earned: myChains.length > 0,
      hint: "Take part in a multi-party chain",
    },
    {
      icon: Award,
      label: "Well reviewed",
      earned: aboutMe.length >= 3 && avg >= 4,
      hint: "Earn 3 reviews averaging 4 stars",
    },
  ];

  const others = profiles.filter((p) => p.id !== user?.id);
  const [subject, setSubject] = useState("");
  const [rating, setRating] = useState(5);
  const [skill, setSkill] = useState("");
  const [comment, setComment] = useState("");

  const addReview = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      if (!subject) throw new Error("Choose who you're reviewing.");
      const { error } = await supabase.from("reviews").insert({
        reviewer_id: user.id,
        subject_id: subject,
        rating,
        skill: skill.trim(),
        comment: comment.trim(),
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setComment("");
      setSkill("");
      qc.invalidateQueries({ queryKey: ["reviews"] });
    },
  });

  return (
    <AppShell title="Reputation & skill score" subtitle="Trust you've built in the community">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Skill score" value={score} hint="Skills, chains, projects & reviews" />
        <Stat
          label="Trust rating"
          value={avg ? `${avg.toFixed(1)} / 5` : "—"}
          hint={`${aboutMe.length} review${aboutMe.length === 1 ? "" : "s"}`}
        />
        <Stat label="Badges earned" value={badges.filter((b) => b.earned).length} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <SectionTitle>Badges</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            {badges.map(({ icon: Icon, label, earned, hint }) => (
              <div
                key={label}
                className={`flex items-start gap-3 rounded-2xl border p-4 ${
                  earned ? "border-primary/40 bg-accent/50" : "border-border opacity-60"
                }`}
              >
                <Icon className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs text-muted-foreground">{hint}</p>
                </div>
              </div>
            ))}
          </div>

          <SectionTitle>Reviews about you</SectionTitle>
          {aboutMe.length === 0 ? (
            <Empty
              title="No reviews yet"
              body="After your first swap, ask your partner to leave a review here."
            />
          ) : (
            <ul className="space-y-3">
              {aboutMe.map((r) => {
                const author = profiles.find((p) => p.id === r.reviewer_id);
                return (
                  <li key={r.id} className="rounded-2xl border border-border p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {initials(author?.display_name ?? "?")}
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{author?.display_name}</p>
                        <p className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${
                                i < r.rating ? "fill-primary text-primary" : "text-border"
                              }`}
                            />
                          ))}
                        </p>
                      </div>
                      {r.skill ? <Pill className="ml-auto">{r.skill}</Pill> : null}
                    </div>
                    {r.comment ? <p className="mt-3 text-sm">{r.comment}</p> : null}
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel>
          <SectionTitle>Leave a review</SectionTitle>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              addReview.mutate();
            }}
          >
            <select
              className={inputClass}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            >
              <option value="">Choose a member…</option>
              {others.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name || "Member"}
                </option>
              ))}
            </select>
            <select
              className={inputClass}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} star{n === 1 ? "" : "s"}
                </option>
              ))}
            </select>
            <input
              className={inputClass}
              placeholder="Skill traded"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
            />
            <textarea
              className={`${inputClass} min-h-24`}
              placeholder="How did the trade go?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button className={btnPrimary} disabled={addReview.isPending}>
              Post review
            </button>
            {addReview.error ? (
              <p className="text-sm text-destructive">{addReview.error.message}</p>
            ) : null}
          </form>
        </Panel>
      </div>
    </AppShell>
  );
}
