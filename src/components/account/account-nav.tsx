"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FilePlus2, Files, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/me/submissions", label: "我的投稿", icon: Files },
  { href: "/me/submissions/new", label: "新建投稿", icon: FilePlus2 },
  { href: "/me/profile", label: "个人资料", icon: UserRound },
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav className="no-scrollbar flex gap-1 overflow-x-auto rounded-card border border-border bg-card p-2 lg:sticky lg:top-24 lg:flex-col">
      {items.map((item) => {
        const active =
          item.href === "/me/submissions"
            ? pathname === item.href || (pathname.startsWith("/me/submissions/") && pathname !== "/me/submissions/new")
            : pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-ui px-3 py-2.5 text-sm font-semibold transition-colors",
              active ? "bg-sidebar-active text-foreground" : "text-muted-foreground hover:bg-surface hover:text-foreground",
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
