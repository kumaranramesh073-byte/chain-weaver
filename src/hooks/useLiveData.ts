import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const TABLES = [
  { table: "profiles", key: "profiles" },
  { table: "skills", key: "skills" },
  { table: "learning_goals", key: "learning_goals" },
  { table: "projects", key: "projects" },
  { table: "project_members", key: "project_members" },
  { table: "reviews", key: "reviews" },
  { table: "messages", key: "messages" },
] as const;

/**
 * Keeps the whole community graph fresh: any insert/update/delete made by any
 * signed-in member (on any device) invalidates the matching query, so direct
 * matches and skill chains re-form live.
 */
export function useLiveData() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase.channel("skillswap-live");

    for (const { table, key } of TABLES) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => void qc.invalidateQueries({ queryKey: [key] }),
      );
    }

    channel.subscribe();

    // Safety net in case the realtime socket drops (flaky networks, sleeping tabs).
    const poll = setInterval(() => {
      for (const { key } of TABLES) void qc.invalidateQueries({ queryKey: [key] });
    }, 20_000);

    const onFocus = () => {
      for (const { key } of TABLES) void qc.invalidateQueries({ queryKey: [key] });
    };
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(poll);
      window.removeEventListener("focus", onFocus);
      void supabase.removeChannel(channel);
    };
  }, [qc]);
}
