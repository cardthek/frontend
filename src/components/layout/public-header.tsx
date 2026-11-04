"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Files, Leaf, LogOut, Plus, Settings, Shield, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useDemoStore } from "@/lib/demo-store";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "首页" },
  { href: "/cards", label: "卡面档案" },
  { href: "/about", label: "关于" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const { state, currentUser, logout, can } = useDemoStore();
  const loginHref = pathname !== "/login" ? `/login?next=${encodeURIComponent(pathname)}` : "/login";

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/88 backdrop-blur-xl">
      <div className="container-page flex h-18 items-center justify-between gap-4">
        <Link href="/" className="group flex items-center gap-3">
          <span className="flex size-10 rotate-[-4deg] items-center justify-center rounded-[45%_55%_48%_52%] bg-primary text-primary-foreground transition-transform group-hover:rotate-0">
            <Leaf className="size-5" />
          </span>
          <span>
            <span className="block font-serif text-xl font-bold leading-none tracking-tight">
              {state.settings.siteName}
            </span>
            <span className="mt-1 block text-[0.62rem] font-semibold tracking-[0.16em] text-muted-foreground">
              CARD ARCHIVE
            </span>
          </span>
        </Link>

        <nav className="no-scrollbar hidden items-center gap-1 overflow-x-auto md:flex" aria-label="主导航">
          {navItems.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-pill px-4 py-2 text-sm font-medium transition-colors hover:bg-surface",
                  active ? "bg-surface text-foreground" : "text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {currentUser ? (
            <>
              <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
                <Link href="/me/submissions/new">
                  <Plus className="size-4" />
                  投稿
                </Link>
              </Button>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button type="button" className="rounded-full ring-offset-background transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" aria-label="打开用户菜单" title="用户菜单">
                    <Avatar name={currentUser.displayName} tone={currentUser.avatarTone} className="size-9" />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content align="end" sideOffset={8} className="z-[75] w-60 rounded-card border border-border bg-popover p-1.5 text-popover-foreground shadow-float">
                    <DropdownMenu.Label className="px-3 py-2.5">
                      <span className="block text-sm font-semibold">{currentUser.displayName}</span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">@{currentUser.username}</span>
                    </DropdownMenu.Label>
                    <DropdownMenu.Separator className="my-1 h-px bg-border" />
                    <UserMenuItem href={`/u/${currentUser.slug}`} icon={UserRound}>个人主页</UserMenuItem>
                    <UserMenuItem href="/me/submissions" icon={Files}>我的投稿</UserMenuItem>
                    <UserMenuItem href="/me/submissions/new" icon={Plus}>新建投稿</UserMenuItem>
                    <UserMenuItem href="/me/profile" icon={Settings}>账号设置</UserMenuItem>
                    {can("dashboard.read") && <UserMenuItem href="/admin" icon={Shield}>后台管理</UserMenuItem>}
                    <DropdownMenu.Separator className="my-1 h-px bg-border" />
                    <DropdownMenu.Item onSelect={logout} className="flex cursor-pointer items-center gap-2.5 rounded-ui px-3 py-2 text-sm text-destructive outline-none transition-colors data-[highlighted]:bg-destructive/10">
                      <LogOut className="size-4" />
                      退出登录
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href={loginHref}>登录</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">
                  <UserRound className="size-4" />
                  加入卡迹
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
      <nav className="no-scrollbar flex gap-1 overflow-x-auto border-t border-border/50 px-4 py-2 md:hidden" aria-label="移动导航">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "whitespace-nowrap rounded-pill px-3 py-1.5 text-xs font-semibold",
              pathname === item.href ? "bg-surface" : "text-muted-foreground",
            )}
          >
            {item.label}
          </Link>
        ))}
        {currentUser && (
          <Link href="/me/submissions" className="whitespace-nowrap rounded-pill px-3 py-1.5 text-xs font-semibold text-muted-foreground">
            我的投稿
          </Link>
        )}
      </nav>
    </header>
  );
}

function UserMenuItem({ href, icon: Icon, children }: { href: string; icon: typeof UserRound; children: React.ReactNode }) {
  return (
    <DropdownMenu.Item asChild className="outline-none">
      <Link href={href} className="flex cursor-pointer items-center gap-2.5 rounded-ui px-3 py-2 text-sm text-foreground transition-colors data-[highlighted]:bg-surface">
        <Icon className="size-4 text-muted-foreground" />
        {children}
      </Link>
    </DropdownMenu.Item>
  );
}
