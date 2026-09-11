import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Panel, Empty, inputClass, btnPrimary } from "@/components/ui-bits";
import { currentUserQuery, profilesQuery, messagesQuery, initials } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/messages")({
  validateSearch: (search: Record<string, unknown>) => ({
    to: typeof search["to"] === "string" ? (search["to"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Messages — SkillSwap" },
      { name: "description", content: "Talk directly with your skill-trade partners." },
      { property: "og:title", content: "Messages — SkillSwap" },
      { property: "og:description", content: "Direct conversations with your swap partners." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { to } = Route.useSearch();
  const { data: user } = useQuery(currentUserQuery);
  const { data: profiles = [] } = useQuery(profilesQuery);
  const { data: messages = [] } = useQuery(messagesQuery);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const others = profiles.filter((p) => p.id !== user?.id);
  const active = to ?? others[0]?.id;
  const partner = others.find((p) => p.id === active);

  const thread = messages.filter(
    (m) =>
      (m.sender_id === user?.id && m.recipient_id === active) ||
      (m.sender_id === active && m.recipient_id === user?.id),
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [thread.length, active]);

  const send = useMutation({
    mutationFn: async () => {
      if (!user || !active) throw new Error("Pick someone to message first.");
      const { error } = await supabase
        .from("messages")
        .insert({ sender_id: user.id, recipient_id: active, body: draft.trim() });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setDraft("");
      qc.invalidateQueries({ queryKey: ["messages"] });
    },
  });

  if (others.length === 0) {
    return (
      <AppShell title="Messages" subtitle="Talk to your trade partners">
        <Empty
          title="Nobody to message yet"
          body="Once other members join the community they'll show up here."
        />
      </AppShell>
    );
  }

  return (
    <AppShell title="Messages" subtitle="Talk to your trade partners">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Panel className="max-h-[70vh] overflow-y-auto">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Conversations</h2>
          <ul className="space-y-1">
            {others.map((p) => {
              const last = messages
                .filter(
                  (m) =>
                    (m.sender_id === user?.id && m.recipient_id === p.id) ||
                    (m.sender_id === p.id && m.recipient_id === user?.id),
                )
                .at(-1);
              return (
                <li key={p.id}>
                  <button
                    onClick={() => navigate({ to: "/messages", search: { to: p.id } })}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors ${
                      p.id === active ? "bg-accent" : "hover:bg-secondary"
                    }`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {initials(p.display_name)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {p.display_name || "Member"}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {last?.body ?? "No messages yet"}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel className="flex h-[70vh] flex-col">
          <h2 className="mb-4 font-display text-base font-bold">
            {partner?.display_name || "Select a member"}
          </h2>
          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {thread.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No messages yet — say hello and suggest a swap.
              </p>
            ) : (
              thread.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.sender_id === user?.id
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {m.body}
                </div>
              ))
            )}
            <div ref={endRef} />
          </div>

          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (draft.trim()) send.mutate();
            }}
          >
            <input
              className={inputClass}
              placeholder="Write a message…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button className={btnPrimary} disabled={send.isPending}>
              <Send className="h-4 w-4" /> Send
            </button>
          </form>
          {send.error ? (
            <p className="mt-2 text-sm text-destructive">{send.error.message}</p>
          ) : null}
        </Panel>
      </div>
    </AppShell>
  );
}
