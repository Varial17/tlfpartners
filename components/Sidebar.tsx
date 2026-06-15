"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Inbox,
  Kanban,
  BookOpen,
  Radio,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Logo } from "@/components/Logo";
import { cn, initials } from "@/lib/utils";

const nav = [
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/board", label: "Ticket board", icon: Kanban },
  { href: "/knowledge", label: "Knowledge base", icon: BookOpen },
  { href: "/channels", label: "Channels", icon: Radio },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

export function Sidebar({ user }: { user?: { name?: string | null; email?: string | null } }) {
  const pathname = usePathname();
  return (
    <aside className="flex w-60 shrink-0 flex-col bg-navy text-cream">
      <div className="px-5 py-5 border-b border-white/10">
        <Logo />
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-orange text-navy font-semibold"
                  : "text-cream/80 hover:bg-white/10",
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange text-navy text-sm font-bold">
            {initials(user?.name ?? "TLF")}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-sm font-medium">
              {user?.name ?? "Staff"}
            </div>
            <div className="truncate text-xs text-cream/60">
              {user?.email ?? ""}
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-lg p-1.5 text-cream/70 hover:bg-white/10 hover:text-cream"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
