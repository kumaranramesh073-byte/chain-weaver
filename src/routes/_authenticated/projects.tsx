import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, UserPlus, UserMinus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import {
  Panel,
  SectionTitle,
  Pill,
  Empty,
  inputClass,
  btnPrimary,
  btnGhost,
} from "@/components/ui-bits";
import {
  currentUserQuery,
  profilesQuery,
  projectsQuery,
  projectMembersQuery,
  skillsQuery,
  initials,
} from "@/lib/data";

export const Route = createFileRoute("/_authenticated/projects")({
  head: () => ({
    meta: [
      { title: "Collaborative projects — SkillSwap" },
      {
        name: "description",
        content: "Team up on projects that need complementary skills from across the community.",
      },
      { property: "og:title", content: "Collaborative projects — SkillSwap" },
      {
        property: "og:description",
        content: "Start a project, list the skills it needs and let the right people join.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const qc = useQueryClient();
  const { data: user } = useQuery(currentUserQuery);
  const { data: profiles = [] } = useQuery(profilesQuery);
  const { data: projects = [] } = useQuery(projectsQuery);
  const { data: memberships = [] } = useQuery(projectMembersQuery);
  const { data: skills = [] } = useQuery(skillsQuery);

  const myTeaches = skills
    .filter((s) => s.user_id === user?.id && s.kind === "teach")
    .map((s) => s.name.toLowerCase());

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [needed, setNeeded] = useState("");

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["projects"] });
    qc.invalidateQueries({ queryKey: ["project_members"] });
  };

  const create = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("projects")
        .insert({
          owner_id: user.id,
          title: title.trim(),
          summary: summary.trim(),
          needed_skills: needed
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      await supabase
        .from("project_members")
        .insert({ project_id: data.id, user_id: user.id, role: "owner" });
    },
    onSuccess: () => {
      setTitle("");
      setSummary("");
      setNeeded("");
      invalidate();
    },
  });

  const join = useMutation({
    mutationFn: async (projectId: string) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("project_members")
        .insert({ project_id: projectId, user_id: user.id });
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  const leave = useMutation({
    mutationFn: async (projectId: string) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("project_members")
        .delete()
        .eq("project_id", projectId)
        .eq("user_id", user.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", projectId);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  return (
    <AppShell title="Collaborative projects" subtitle="Build something with complementary skills">
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel>
          <SectionTitle>Start a project</SectionTitle>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (title.trim()) create.mutate();
            }}
          >
            <input
              className={inputClass}
              placeholder="Project title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className={`${inputClass} min-h-24`}
              placeholder="What are you building?"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Skills needed, comma separated"
              value={needed}
              onChange={(e) => setNeeded(e.target.value)}
            />
            <button className={btnPrimary} disabled={create.isPending}>
              Create project
            </button>
            {create.error ? (
              <p className="text-sm text-destructive">{create.error.message}</p>
            ) : null}
          </form>
        </Panel>

        <div className="space-y-4 lg:col-span-2">
          {projects.length === 0 ? (
            <Empty
              title="No projects yet"
              body="Start one and list the skills it needs — members with those skills will see it here."
            />
          ) : (
            projects.map((project) => {
              const team = memberships.filter((m) => m.project_id === project.id);
              const joined = team.some((m) => m.user_id === user?.id);
              const fit = project.needed_skills.filter((s) =>
                myTeaches.includes(s.toLowerCase()),
              );
              return (
                <Panel key={project.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-base font-bold">{project.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{project.summary}</p>
                    </div>
                    {project.owner_id === user?.id ? (
                      <button
                        onClick={() => remove.mutate(project.id)}
                        aria-label="Delete project"
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {project.needed_skills.map((s) => (
                      <Pill key={s} tone={fit.includes(s) ? "teach" : "neutral"}>
                        {s}
                      </Pill>
                    ))}
                    {fit.length ? (
                      <Pill tone="learn">You cover {fit.length} of these</Pill>
                    ) : null}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <div className="flex -space-x-2">
                      {team.map((m) => {
                        const p = profiles.find((x) => x.id === m.user_id);
                        return (
                          <span
                            key={m.id}
                            title={p?.display_name}
                            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-primary text-[10px] font-bold text-primary-foreground"
                          >
                            {initials(p?.display_name ?? "?")}
                          </span>
                        );
                      })}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {team.length} member{team.length === 1 ? "" : "s"}
                    </span>
                    {joined ? (
                      <button className={btnGhost} onClick={() => leave.mutate(project.id)}>
                        <UserMinus className="h-4 w-4" /> Leave
                      </button>
                    ) : (
                      <button className={btnPrimary} onClick={() => join.mutate(project.id)}>
                        <UserPlus className="h-4 w-4" /> Join project
                      </button>
                    )}
                  </div>
                </Panel>
              );
            })
          )}
        </div>
      </div>
    </AppShell>
  );
}
