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
import { useAppStore } from "@/lib/app-store";

function loginDestination() {
  if (typeof window === "undefined") return "/";
  const next = new URLSearchParams(window.location.search).get("next");
  return next?.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export default function LoginPage() {
  const router = useRouter();
  const { login, currentUser, logout } = useAppStore();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!identifier || !password) {
      toast.error("请输入账号与密码");
      return;
    }
    setSubmitting(true);
    const result = await login(identifier, password);
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success(result.message);
    router.push(loginDestination());
  }

  return (
    <Card className="p-6 md:p-8">
      <p className="label-caps">Welcome Back</p>
      <h1 className="mt-3 font-serif text-3xl font-bold">登录卡迹</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">用户名或邮箱均可登录。登录状态通过短期访问令牌和 HttpOnly 刷新会话维持。</p>

      {currentUser ? (
        <div className="mt-6 rounded-ui border border-border bg-surface p-4">
          <p className="text-sm">当前已登录为 <strong>{currentUser.displayName}</strong>。</p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => router.push("/")}>返回首页</Button>
            <Button size="sm" variant="outline" onClick={() => void logout()}>退出当前账号</Button>
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
            <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="pl-10" placeholder="输入密码" autoComplete="current-password" />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>{submitting ? "正在登录…" : "登录"} <ArrowRight className="size-4" /></Button>
        </form>
      )}

      <div className="mt-4 flex items-center justify-center gap-3 text-xs">
        <Link href="/register" className="font-semibold text-primary hover:underline">注册新账号</Link>
      </div>
    </Card>
  );
}
