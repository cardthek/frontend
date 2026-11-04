"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, Palette, RotateCcw, Settings2, Sparkles, UserRound, Users, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useDemoStore } from "@/lib/demo-store";
import { themeName, themeOptions } from "@/lib/theme";
import type { ThemeId } from "@/lib/types";
import { cn } from "@/lib/utils";

export function DemoController() {
  const router = useRouter();
  const { state, currentUser, switchSession, setTheme, resetDemo } = useDemoStore();
  const [open, setOpen] = useState(false);
  const demoUsers = state.users.filter((user) => ["admin", "reviewer", "lin"].includes(user.username));

  function chooseUser(id: number | null) {
    switchSession(id);
    const user = state.users.find((candidate) => candidate.id === id);
    toast.success(user ? `已切换为 ${user.displayName}` : "已切换为访客视角");
  }

  function chooseTheme(theme: ThemeId) {
    setTheme(theme);
    toast.success(`主题已切换为「${themeName(theme)}」`);
  }

  function restartSetup() {
    resetDemo(false);
    setOpen(false);
    router.push("/setup");
  }

  function resetAll() {
    resetDemo(true);
    setOpen(false);
    router.push("/");
    toast.success("演示数据已重置");
  }

  return (
    <div className="fixed bottom-4 right-4 z-[80] flex flex-col items-end gap-3 print:hidden">
      {open && (
        <div className="w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-card border border-border bg-card shadow-float animate-rise">
          <div className="flex items-center justify-between border-b border-border/70 bg-surface/70 px-4 py-3">
            <div>
              <p className="font-serif text-base font-bold">演示控制台</p>
              <p className="mt-0.5 text-[0.65rem] text-muted-foreground">身份、主题与安装流程</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="关闭演示控制台">
              <X className="size-4" />
            </Button>
          </div>

          <div className="space-y-5 p-4">
            <section>
              <div className="mb-2.5 flex items-center gap-2">
                <Users className="size-3.5 text-secondary" />
                <p className="label-caps !mb-0">切换身份</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => chooseUser(null)}
                  className={cn(
                    "flex items-center gap-2 rounded-ui border px-3 py-2 text-left text-xs transition-colors",
                    !currentUser ? "border-primary bg-surface" : "border-border hover:bg-surface",
                  )}
                >
                  <span className="flex size-7 items-center justify-center rounded-full bg-muted"><UserRound className="size-3.5" /></span>
                  访客
                </button>
                {demoUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => chooseUser(user.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-ui border px-3 py-2 text-left text-xs transition-colors",
                      currentUser?.id === user.id ? "border-primary bg-surface" : "border-border hover:bg-surface",
                    )}
                  >
                    <Avatar name={user.displayName} tone={user.avatarTone} className="size-7 text-[0.6rem]" />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{user.displayName}</span>
                      <span className="block truncate text-[0.6rem] text-muted-foreground">@{user.username}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <div className="mb-2.5 flex items-center gap-2">
                <Palette className="size-3.5 text-secondary" />
                <p className="label-caps !mb-0">主题样式</p>
              </div>
              <div className="space-y-2">
                {themeOptions.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => chooseTheme(theme.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-ui border px-3 py-2.5 text-left transition-colors",
                      state.theme === theme.id ? "border-primary bg-surface" : "border-border hover:bg-surface",
                    )}
                  >
                    <span>
                      <span className="block text-xs font-semibold">{theme.name}</span>
                      <span className="mt-0.5 block text-[0.62rem] text-muted-foreground">{theme.note}</span>
                    </span>
                    <span className="flex gap-1" aria-hidden="true">
                      <span className="size-3 rounded-full bg-primary" />
                      <span className="size-3 rounded-full bg-secondary" />
                      <span className="size-3 rounded-full bg-accent" />
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="flex flex-wrap gap-2 border-t border-border/70 pt-4">
              <Button variant="outline" size="sm" onClick={restartSetup}>
                <Settings2 className="size-3.5" /> 安装流程
              </Button>
              <Button variant="ghost" size="sm" onClick={resetAll}>
                <RotateCcw className="size-3.5" /> 重置演示
              </Button>
            </section>
            <p className="text-[0.62rem] leading-5 text-muted-foreground">
              主题由语义化 CSS 变量驱动，切换主题不会改变组件与业务代码。刷新会恢复初始演示状态。
            </p>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((value) => !value)}
        className="flex h-12 items-center gap-2.5 rounded-pill border border-border bg-card px-4 text-xs font-bold shadow-float transition-transform hover:-translate-y-0.5"
        aria-expanded={open}
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Sparkles className="size-3.5" />
        </span>
        <span className="hidden sm:inline">演示控制</span>
        <ChevronUp className={cn("size-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
    </div>
  );
}
