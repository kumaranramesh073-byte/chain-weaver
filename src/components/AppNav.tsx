import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function AppNav({ email }: { email?: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="border-b border-border bg-card/70 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-6 py-4">
        <Link to="/skills" className="font-display text-lg font-bold tracking-tight">
          Skill<span className="text-gradient">Swap</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/skills"
            className="rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground [&.active]:bg-accent [&.active]:text-accent-foreground"
          >
            My skills
          </Link>
          <Link
            to="/chains"
            className="rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground [&.active]:bg-accent [&.active]:text-accent-foreground"
          >
            Skill chains
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          {email ? <span className="hidden text-muted-foreground sm:inline">{email}</span> : null}
          <button
            onClick={signOut}
            className="rounded-full border border-border px-3 py-1.5 font-medium transition-colors hover:bg-secondary"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
