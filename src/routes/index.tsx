import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SkillSwap — Trade skills in circles, not just pairs" },
      {
        name: "description",
        content:
          "Sign in from any computer, list what you can teach and what you want to learn, and SkillSwap finds the chain of people that makes the swap work.",
      },
      { property: "og:title", content: "SkillSwap — Trade skills in circles" },
      {
        property: "og:description",
        content:
          "One shared community across every computer. SkillSwap finds multi-person skill chains for you.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-20 text-center">
      <span className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-accent-foreground">
        One account · any computer
      </span>
      <h1 className="mt-6 text-4xl font-bold sm:text-6xl">
        Trade skills in <span className="text-gradient">circles</span>, not just pairs
      </h1>
      <p className="mt-5 max-w-xl text-lg text-muted-foreground">
        Sign in, say what you can teach and what you want to learn. SkillSwap checks everyone in the
        community and shows the chain that makes the swap work.
      </p>
      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <Link
          to={signedIn ? "/chains" : "/auth"}
          className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          {signedIn ? "See my skill chains" : "Sign in or create an account"}
        </Link>
        <Link
          to={signedIn ? "/skills" : "/auth"}
          className="rounded-full border border-border px-6 py-3 text-sm font-semibold transition-colors hover:bg-secondary"
        >
          {signedIn ? "My skills" : "How it works"}
        </Link>
      </div>

      <div className="mt-16 grid w-full gap-4 text-left sm:grid-cols-3">
        {[
          { n: "01", t: "Sign in anywhere", d: "The same account works on every computer you use." },
          { n: "02", t: "List your skills", d: "What you can teach, what you'd like to learn." },
          {
            n: "03",
            t: "Get your chain",
            d: "We find the loop where everyone gets what they asked for.",
          },
        ].map((s) => (
          <div key={s.n} className="surface p-5">
            <div className="font-display text-sm font-bold text-primary">{s.n}</div>
            <h2 className="mt-2 text-base font-semibold">{s.t}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
