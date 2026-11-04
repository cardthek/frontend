"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, KeyRound, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useDemoStore } from "@/lib/demo-store";

function loginDestination() {
  if (typeof window === "undefined") return "/";
  const next = new URLSearchParams(window.location.search).get("next");
  return next?.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export default function LoginPage() {
  const router = useRouter();
  const { state, login, currentUser, switchSession, logout } = useDemoStore();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!identifier || !password) {
      toast.error("请输入账号与密码");
      return;
    }
    const result = login(identifier);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success(result.message);
    router.push(loginDestination());
  }

  const demoAccounts = state.users.filter((user) => user.status === "active" && ["lin", "reviewer", "admin"].includes(user.username));

  return (
    <Card className="p-6 md:p-8">
      <p className="label-caps">Welcome Back</p>
      <h1 className="mt-3 font-serif text-3xl font-bold">登录卡迹</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">用户名或邮箱均可登录。演示环境不校验密码；如果账号在演示中被停用或注销，刷新页面即可恢复初始数据。</p>

      {currentUser ? (
        <div className="mt-6 rounded-ui border border-border bg-surface p-4">
          <p className="text-sm">当前已登录为 <strong>{currentUser.displayName}</strong>。</p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => router.push("/")}>返回首页</Button>
            <Button size="sm" variant="outline" onClick={logout}>退出当前账号</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="identifier">用户名或邮箱</Label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="identifier" value={identifier} onChange={(event) => setIdentifier(event.target.value)} className="pl-10" placeholder="例如 lin 或 lin@example.com" autoComplete="username" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password">密码</Label>
              <Link href="/forgot-password" className="mb-2 text-xs font-semibold text-primary hover:underline">忘记密码？</Link>
            </div>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="pl-10" placeholder="任意非空内容" autoComplete="current-password" />
            </div>
          </div>
          <Button type="submit" className="w-full">登录 <ArrowRight className="size-4" /></Button>
        </form>
      )}

      <div className="mt-6 border-t border-border/70 pt-5">
        <p className="label-caps mb-3">快速体验账号</p>
        <div className="space-y-2">
          {demoAccounts.map((user) => (
            <button
              key={user.id}
              onClick={() => { switchSession(user.id); toast.success(`已切换为 ${user.displayName}`); router.push(loginDestination()); }}
              className="flex w-full items-center justify-between rounded-ui border border-border px-3 py-2.5 text-left transition-colors hover:bg-surface"
            >
              <span><span className="block text-xs font-semibold">{user.displayName}</span><span className="mt-0.5 block text-[0.65rem] text-muted-foreground">@{user.username} · {user.roleIds[0]}</span></span>
              <ArrowRight className="size-3.5 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-3 text-xs">
        <button type="button" onClick={() => window.location.reload()} className="font-semibold text-primary hover:underline">刷新并恢复演示账号</button>
        <span className="text-muted-foreground">·</span>
        <Link href="/register" className="font-semibold text-primary hover:underline">注册新账号</Link>
      </div>
    </Card>
  );
}
