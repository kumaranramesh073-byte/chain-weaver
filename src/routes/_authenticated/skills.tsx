import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Panel, SectionTitle, Pill, inputClass, btnPrimary, btnGhost } from "@/components/ui-bits";
import { currentUserQuery, profilesQuery, skillsQuery, type Skill } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/skills")({
  head: () => ({
    meta: [
      { title: "My skills & profile — SkillSwap" },
      {
        name: "description",
        content: "Manage the skills you teach, the skills you want to learn, and your profile.",
      },
      { property: "og:title", content: "My skills & profile — SkillSwap" },
      {
        property: "og:description",
        content: "Keep your teaching and learning skills up to date so better swaps find you.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SkillsPage,
});

const LEVELS = ["beginner", "intermediate", "advanced", "expert"] as const;

function SkillsPage() {
  const qc = useQueryClient();
  const { data: user } = useQuery(currentUserQuery);
  const { data: profiles = [] } = useQuery(profilesQuery);
  const { data: skills = [] } = useQuery(skillsQuery);
  const me = profiles.find((p) => p.id === user?.id);

  const mine = skills.filter((s) => s.user_id === user?.id);
  const teaches = mine.filter((s) => s.kind === "teach");
  const wants = mine.filter((s) => s.kind === "learn");

  const [form, setForm] = useState({
    name: "",
    kind: "teach" as Skill["kind"],
    proficiency: "intermediate" as Skill["proficiency"],
    category: "General",
  });

  const [profileForm, setProfileForm] = useState<{
    display_name: string;
    headline: string;
    bio: string;
    location: string;
  } | null>(null);
  const p = profileForm ?? {
    display_name: me?.display_name ?? "",
    headline: me?.headline ?? "",
    bio: me?.bio ?? "",
    location: me?.location ?? "",
  };

  const addSkill = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("skills").insert({ ...form, user_id: user.id });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setForm({ ...form, name: "" });
      qc.invalidateQueries({ queryKey: ["skills"] });
    },
  });

  const removeSkill = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("skills").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["skills"] }),
  });

  const saveProfile = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("profiles").update(p).eq("id", user.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profiles"] }),
  });

  return (
    <AppShell title="My skills & profile" subtitle="What you can teach and what you want to learn">
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <SectionTitle>Add a skill</SectionTitle>
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (form.name.trim()) addSkill.mutate();
            }}
          >
            <input
              className={inputClass}
              placeholder="e.g. Guitar, React, Spanish"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className={inputClass}
              placeholder="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
            <select
              className={inputClass}
              value={form.kind}
              onChange={(e) => setForm({ ...form, kind: e.target.value as Skill["kind"] })}
            >
              <option value="teach">I can teach this</option>
              <option value="learn">I want to learn this</option>
            </select>
            <select
              className={inputClass}
              value={form.proficiency}
              onChange={(e) =>
                setForm({ ...form, proficiency: e.target.value as Skill["proficiency"] })
              }
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <div className="sm:col-span-2">
              <button className={btnPrimary} disabled={addSkill.isPending}>
                Add skill
              </button>
              {addSkill.error ? (
                <p className="mt-2 text-sm text-destructive">{addSkill.error.message}</p>
              ) : null}
            </div>
          </form>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <SkillList
              title="I teach"
              items={teaches}
              tone="teach"
              onRemove={(id) => removeSkill.mutate(id)}
            />
            <SkillList
              title="I want to learn"
              items={wants}
              tone="learn"
              onRemove={(id) => removeSkill.mutate(id)}
            />
          </div>
        </Panel>

        <Panel>
          <SectionTitle>Profile</SectionTitle>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              saveProfile.mutate();
            }}
          >
            <input
              className={inputClass}
              placeholder="Display name"
              value={p.display_name}
              onChange={(e) => setProfileForm({ ...p, display_name: e.target.value })}
            />
            <input
              className={inputClass}
              placeholder="Headline, e.g. Frontend dev & pianist"
              value={p.headline}
              onChange={(e) => setProfileForm({ ...p, headline: e.target.value })}
            />
            <input
              className={inputClass}
              placeholder="Location"
              value={p.location}
              onChange={(e) => setProfileForm({ ...p, location: e.target.value })}
            />
            <textarea
              className={`${inputClass} min-h-28`}
              placeholder="A short bio"
              value={p.bio}
              onChange={(e) => setProfileForm({ ...p, bio: e.target.value })}
            />
            <button className={btnGhost} disabled={saveProfile.isPending}>
              {saveProfile.isPending ? "Saving…" : "Save profile"}
            </button>
            {saveProfile.isSuccess ? (
              <p className="text-sm text-primary">Profile saved.</p>
            ) : null}
          </form>
        </Panel>
      </div>
    </AppShell>
  );
}

function SkillList({
  title,
  items,
  tone,
  onRemove,
}: {
  title: string;
  items: Skill[];
  tone: "teach" | "learn";
  onRemove: (id: string) => void;
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-muted-foreground">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing here yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-border px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">
                  {s.category} · {s.proficiency}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Pill tone={tone}>{tone === "teach" ? "teach" : "learn"}</Pill>
                <button
                  onClick={() => onRemove(s.id)}
                  aria-label={`Remove ${s.name}`}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
