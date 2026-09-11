import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import {
  Panel,
  SectionTitle,
  Pill,
  Empty,
  inputClass,
  btnPrimary,
} from "@/components/ui-bits";
import { currentUserQuery, goalsQuery, type LearningGoal } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/goals")({
  head: () => ({
    meta: [
      { title: "Learning goals — SkillSwap" },
      {
        name: "description",
        content: "Set the skills you want to acquire, rank them by priority and track progress.",
      },
      { property: "og:title", content: "Learning goals — SkillSwap" },
      {
        property: "og:description",
        content: "Target skills, priorities and deadlines for your next swap.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GoalsPage,
});

const PRIORITY = { 1: "High", 2: "Medium", 3: "Low" } as const;

function GoalsPage() {
  const qc = useQueryClient();
  const { data: user } = useQuery(currentUserQuery);
  const { data: goals = [] } = useQuery(goalsQuery);
  const mine = goals.filter((g) => g.user_id === user?.id);

  const [skill, setSkill] = useState("");
  const [priority, setPriority] = useState(2);
  const [targetDate, setTargetDate] = useState("");
  const [notes, setNotes] = useState("");

  const add = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("learning_goals").insert({
        user_id: user.id,
        skill: skill.trim(),
        priority,
        notes,
        target_date: targetDate || null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setSkill("");
      setNotes("");
      setTargetDate("");
      qc.invalidateQueries({ queryKey: ["learning_goals"] });
    },
  });

  const update = useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<Pick<LearningGoal, "priority" | "progress" | "status">>;
    }) => {
      const { error } = await supabase.from("learning_goals").update(patch).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["learning_goals"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("learning_goals").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["learning_goals"] }),
  });

  return (
    <AppShell title="Learning goals" subtitle="What you want to be able to do next">
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel>
          <SectionTitle>New goal</SectionTitle>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (skill.trim()) add.mutate();
            }}
          >
            <input
              className={inputClass}
              placeholder="Skill to acquire"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
            />
            <select
              className={inputClass}
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
            >
              <option value={1}>High priority</option>
              <option value={2}>Medium priority</option>
              <option value={3}>Low priority</option>
            </select>
            <input
              type="date"
              className={inputClass}
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
            <textarea
              className={`${inputClass} min-h-20`}
              placeholder="Why this matters (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <button className={btnPrimary} disabled={add.isPending}>
              Add goal
            </button>
          </form>
        </Panel>

        <div className="space-y-4 lg:col-span-2">
          {mine.length === 0 ? (
            <Empty
              title="No goals yet"
              body="Add the skills you want to acquire and rank them so the AI mentor and matches can prioritise them."
            />
          ) : (
            mine
              .slice()
              .sort((a, b) => a.priority - b.priority)
              .map((g) => (
                <Panel key={g.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-base font-bold">{g.skill}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {g.notes || "No notes"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Pill tone={g.priority === 1 ? "warn" : "neutral"}>
                        {PRIORITY[g.priority as 1 | 2 | 3]} priority
                      </Pill>
                      {g.target_date ? <Pill>by {g.target_date}</Pill> : null}
                      <button
                        onClick={() => remove.mutate(g.id)}
                        aria-label={`Remove ${g.skill}`}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={g.progress}
                      onChange={(e) =>
                        update.mutate({ id: g.id, patch: { progress: Number(e.target.value) } })
                      }
                      className="h-2 flex-1 accent-[var(--primary)]"
                    />
                    <span className="text-sm font-semibold">{g.progress}%</span>
                    <select
                      className="rounded-full border border-border px-3 py-1.5 text-xs"
                      value={g.status}
                      onChange={(e) =>
                        update.mutate({
                          id: g.id,
                          patch: { status: e.target.value as LearningGoal["status"] },
                        })
                      }
                    >
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                </Panel>
              ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
