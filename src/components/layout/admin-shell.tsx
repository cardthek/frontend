"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive,
  BookOpen,
  ChevronLeft,
  ClipboardCheck,
  FolderKanban,
  Gauge,
  GitPullRequest,
  History,
  Images,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useDemoStore } from "@/lib/demo-store";
import type { PermissionKey } from "@/lib/types";
import { cn } from "@/lib/utils";

const adminNav: Array<{
  href: string;
  label: string;
  icon: typeof Gauge;
  permission: PermissionKey;
}> = [
  { href: "/admin", label: "概览", icon: Gauge, permission: "dashboard.read" },
  { href: "/admin/submissions", label: "投稿审核", icon: ClipboardCheck, permission: "submissions.read" },
  { href: "/admin/contributions", label: "协作审核", icon: GitPullRequest, permission: "submissions.review" },
  { href: "/admin/cards", label: "卡片管理", icon: Archive, permission: "cards.read" },
  { href: "/admin/users", label: "用户", icon: Users, permission: "users.read" },
  { href: "/admin/roles", label: "用户组与权限", icon: ShieldCheck, permission: "roles.read" },
  { href: "/admin/dictionaries", label: "字典", icon: BookOpen, permission: "dictionaries.manage" },
  { href: "/admin/media", label: "媒体库", icon: Images, permission: "media.manage" },
  { href: "/admin/settings", label: "站点设置", icon: Settings, permission: "settings.read" },
  { href: "/admin/audit", label: "审计日志", icon: History, permission: "audit.read" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser, can, state } = useDemoStore();
  const visibleNav = adminNav.filter((item) => can(item.permission));

  return (
    <div className="admin-grid min-h-screen bg-background">
      <aside className="hidden min-h-screen border-r border-border/70 bg-sidebar px-4 py-5 lg:sticky lg:top-0 lg:block lg:h-screen">
        <Link href="/" className="mb-7 flex items-center gap-3 px-2">
          <span className="flex size-10 items-center justify-center rounded-[45%_55%_48%_52%] bg-primary text-primary-foreground">
            <FolderKanban className="size-5" />
          </span>
          <span>
            <span className="block font-serif text-lg font-bold leading-none">{state.settings.siteName}</span>
            <span className="mt-1 block text-[0.6rem] font-bold tracking-[0.16em] text-muted-foreground">STUDIO</span>
          </span>
        </Link>
        <nav className="space-y-1">
          {visibleNav.map((item) => {
            const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-ui px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-active text-foreground"
                    : "text-muted-foreground hover:bg-surface hover:text-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-8 rounded-ui border border-border/70 bg-card/60 p-3">
          <p className="text-[0.65rem] font-bold tracking-[0.13em] text-muted-foreground">演示模式</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            当前身份决定可见菜单与操作。可在右下角切换身份。
          </p>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/70 bg-background/88 px-4 backdrop-blur-xl md:px-7">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
              <ChevronLeft className="size-4" />
              返回公开站
            </Link>
            <span className="hidden text-border sm:inline">/</span>
            <span className="hidden text-sm font-semibold sm:inline">管理后台</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline">演示数据</Badge>
            {currentUser && (
              <div className="flex items-center gap-2">
                <Avatar name={currentUser.displayName} tone={currentUser.avatarTone} className="size-8" />
                <div className="hidden text-right sm:block">
                  <p className="text-xs font-semibold leading-none">{currentUser.displayName}</p>
                  <p className="mt-1 text-[0.65rem] text-muted-foreground">@{currentUser.username}</p>
                </div>
              </div>
            )}
          </div>
        </header>
        <nav className="no-scrollbar flex gap-1 overflow-x-auto border-b border-border/70 px-3 py-2 lg:hidden">
          {visibleNav.map((item) => (
            <Link key={item.href} href={item.href} className="whitespace-nowrap rounded-pill px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-surface">
              {item.label}
            </Link>
          ))}
        </nav>
        <main className="min-w-0 p-4 md:p-7 lg:p-9">{children}</main>
      </div>
    </div>
  );
}
