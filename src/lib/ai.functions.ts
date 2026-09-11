import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.8-flash";

type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

async function callGateway(messages: ChatMsg[]): Promise<string> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured yet.");

  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({ model: MODEL, messages }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("The AI is busy right now — try again in a moment.");
    if (res.status === 402)
      throw new Error("AI credits have run out. Add credits to keep using the AI features.");
    throw new Error(text || `AI request failed (${res.status}).`);
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return json.choices?.[0]?.message?.content?.trim() ?? "";
}

function parseJson<T>(raw: string): T | null {
  const cleaned = raw
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

export type GapReport = {
  summary: string;
  readiness: number;
  gaps: { skill: string; why: string; priority: "high" | "medium" | "low" }[];
  strengths: string[];
  roadmap: { step: string; detail: string }[];
};

export const analyzeSkillGap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { target: string; teaches: string[]; wants: string[] }) => {
    if (!input?.target?.trim()) throw new Error("Tell us the goal you're aiming for.");
    return {
      target: input.target.trim().slice(0, 200),
      teaches: (input.teaches ?? []).slice(0, 40),
      wants: (input.wants ?? []).slice(0, 40),
    };
  })
  .handler(async ({ data }) => {
    const raw = await callGateway([
      {
        role: "system",
        content:
          "You are a career and learning coach for a skill-swapping community. " +
          "Reply with JSON only, no prose, matching this shape: " +
          '{"summary": string, "readiness": number 0-100, "strengths": string[], ' +
          '"gaps": [{"skill": string, "why": string, "priority": "high"|"medium"|"low"}], ' +
          '"roadmap": [{"step": string, "detail": string}]}. ' +
          "Give 3-6 gaps and 3-5 roadmap steps.",
      },
      {
        role: "user",
        content:
          `Goal: ${data.target}\n` +
          `Skills I already have: ${data.teaches.join(", ") || "none listed"}\n` +
          `Skills I want to learn: ${data.wants.join(", ") || "none listed"}`,
      },
    ]);

    const parsed = parseJson<GapReport>(raw);
    if (!parsed) throw new Error("The analysis came back in an unexpected format. Try again.");
    return parsed;
  });

export const askMentor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { messages: { role: "user" | "assistant"; content: string }[]; context: string }) => ({
      messages: (input.messages ?? []).slice(-16).map((m) => ({
        role: m.role,
        content: String(m.content).slice(0, 4000),
      })),
      context: String(input.context ?? "").slice(0, 4000),
    }),
  )
  .handler(async ({ data }) => {
    const reply = await callGateway([
      {
        role: "system",
        content:
          "You are the SkillSwap AI Mentor: warm, concrete and brief (under 180 words). " +
          "You help members build learning roadmaps and find swap partners inside their community. " +
          "Use the community context when suggesting people to trade with, and name them.\n\n" +
          `Community context:\n${data.context}`,
      },
      ...data.messages.map((m) => ({ role: m.role, content: m.content }) as ChatMsg),
    ]);
    return { reply: reply || "I didn't catch that — could you rephrase?" };
  });
