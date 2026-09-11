import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Member } from "@/lib/chains";

export type Profile = {
  id: string;
  display_name: string;
  headline: string;
  bio: string;
  location: string;
  avatar_color: string;
  trust_score: number;
  trade_hours: number;
  created_at: string;
};

export type Skill = {
  id: string;
  user_id: string;
  name: string;
  kind: "teach" | "learn";
  proficiency: "beginner" | "intermediate" | "advanced" | "expert";
  category: string;
  created_at: string;
};

export type LearningGoal = {
  id: string;
  user_id: string;
  skill: string;
  priority: number;
  target_date: string | null;
  progress: number;
  status: "active" | "paused" | "done";
  notes: string;
  created_at: string;
};

export type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

export type Project = {
  id: string;
  owner_id: string;
  title: string;
  summary: string;
  needed_skills: string[];
  status: "open" | "in_progress" | "complete";
  created_at: string;
};

export type ProjectMember = {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  created_at: string;
};

export type Review = {
  id: string;
  reviewer_id: string;
  subject_id: string;
  rating: number;
  skill: string;
  comment: string;
  created_at: string;
};

async function unwrap<T>(p: PromiseLike<{ data: T | null; error: { message: string } | null }>) {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return (data ?? []) as T;
}

export const currentUserQuery = queryOptions({
  queryKey: ["current-user"],
  queryFn: async () => {
    const { data } = await supabase.auth.getUser();
    return data.user;
  },
  staleTime: 60_000,
});

export const profilesQuery = queryOptions({
  queryKey: ["profiles"],
  queryFn: () =>
    unwrap<Profile[]>(supabase.from("profiles").select("*").order("display_name") as never),
});

export const skillsQuery = queryOptions({
  queryKey: ["skills"],
  queryFn: () => unwrap<Skill[]>(supabase.from("skills").select("*") as never),
});

export const goalsQuery = queryOptions({
  queryKey: ["learning_goals"],
  queryFn: () =>
    unwrap<LearningGoal[]>(
      supabase.from("learning_goals").select("*").order("priority") as never,
    ),
});

export const messagesQuery = queryOptions({
  queryKey: ["messages"],
  queryFn: () =>
    unwrap<Message[]>(
      supabase.from("messages").select("*").order("created_at", { ascending: true }) as never,
    ),
  refetchOnWindowFocus: true,
  refetchInterval: 15_000,
});

export const projectsQuery = queryOptions({
  queryKey: ["projects"],
  queryFn: () =>
    unwrap<Project[]>(
      supabase.from("projects").select("*").order("created_at", { ascending: false }) as never,
    ),
});

export const projectMembersQuery = queryOptions({
  queryKey: ["project_members"],
  queryFn: () => unwrap<ProjectMember[]>(supabase.from("project_members").select("*") as never),
});

export const reviewsQuery = queryOptions({
  queryKey: ["reviews"],
  queryFn: () =>
    unwrap<Review[]>(
      supabase.from("reviews").select("*").order("created_at", { ascending: false }) as never,
    ),
});

/** Build the graph members used by chain + match detection. */
export function toMembers(profiles: Profile[], skills: Skill[]): Member[] {
  return profiles.map((p) => ({
    id: p.id,
    display_name: p.display_name || "Member",
    teaches: skills.filter((s) => s.user_id === p.id && s.kind === "teach").map((s) => s.name),
    wants: skills.filter((s) => s.user_id === p.id && s.kind === "learn").map((s) => s.name),
  }));
}

export function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join("") || "?"
  );
}
