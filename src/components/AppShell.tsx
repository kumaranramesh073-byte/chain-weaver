import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Users2,
  Link2,
  Target,
  MessageSquare,
  Compass,
  FolderKanban,
  Award,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLiveData } from "@/hooks/useLiveData";
import { currentUserQuery, profilesQuery, initials } from "@/lib/data";

const NAV = [
  { to: "/skills", label: "My skills", icon: Target },
  { to: "/matches", label: "Direct matches", icon: Users2 },
  { to: "/chains", label: "Skill chains", icon: Link2 },
  { to: "/discover", label: "Discover", icon: Compass },
  { to: "/goals", label: "Learning goals", icon: Target },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/reputation", label: "Reputation", icon: Award },
] as const;

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  useLiveData();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user } = useQuery(currentUserQuery);
  const { data: profiles } = useQuery(profilesQuery);
  const me = profiles?.find((p) => p.id === user?.id);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const sidebar = (
    <div className="flex h-full flex-col gap-6 p-5">
      <Link to="/skills" className="font-display text-xl font-bold tracking-tight">
        Skill<span className="text-gradient">Swap</span>
      </Link>

      <div className="flex items-center gap-3 rounded-2xl bg-accent/60 p-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          {initials(me?.display_name || user?.email || "?")}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{me?.display_name || "Your profile"}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto text-sm">
        {NAV.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground [&.active]:bg-primary [&.active]:font-semibold [&.active]:text-primary-foreground"
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <button
        onClick={signOut}
        className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary"
      >
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </div>
  );

  return (
    <div className="min-h-screen lg:flex">
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-border bg-card/70 backdrop-blur lg:block">
        {sidebar}
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-foreground/30"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 border-r border-border bg-card shadow-xl">
            {sidebar}
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-card/70 px-5 py-4 backdrop-blur lg:px-8">
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg border border-border p-2 lg:hidden"
            aria-label="Toggle navigation"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold sm:text-xl">{title}</h1>
            {subtitle ? (
              <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
        </header>
        <main className="min-w-0 flex-1 px-5 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
