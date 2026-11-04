"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MailCheck, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, toApiError } from "@/lib/api-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [developmentToken, setDevelopmentToken] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error("请输入有效邮箱");
    setBusy(true);
    try {
      const payload = await apiRequest<{
        message: string;
        developmentToken?: string;
      }>("/auth/forgot-password", {
        method: "POST",
        auth: false,
        body: { email },
      });
      setDevelopmentToken(payload.data.developmentToken ?? null);
      setSent(true);
    } catch (error) {
      toast.error(toApiError(error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-6 md:p-8">
      {sent ? (
        <div className="py-6 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-surface text-secondary"><MailCheck className="size-6" /></span>
          <h1 className="mt-5 font-serif text-3xl font-bold">检查你的邮箱</h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">如果 <strong className="text-foreground">{email}</strong> 已注册，后端会生成一次性重置令牌。生产环境需接入邮件发送服务。</p>
          {developmentToken && (
            <Button asChild className="mt-5">
              <Link href={`/reset-password?token=${encodeURIComponent(developmentToken)}`}>开发环境：继续重置密码</Link>
            </Button>
          )}
          <Button asChild variant="outline" className="mt-6"><Link href="/login">返回登录</Link></Button>
        </div>
      ) : (
        <>
          <p className="label-caps">Recover Access</p>
          <h1 className="mt-3 font-serif text-3xl font-bold">找回密码</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">输入注册邮箱。无论邮箱是否存在，接口都会返回相同结果以避免泄露账号信息。</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div><Label htmlFor="email">注册邮箱</Label><Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" /></div>
            <Button type="submit" className="w-full" disabled={busy}>{busy ? "正在提交…" : "发送重置链接"} <Send className="size-4" /></Button>
          </form>
          <Button asChild variant="ghost" className="mt-4 w-full"><Link href="/login"><ArrowLeft className="size-4" />返回登录</Link></Button>
        </>
      )}
    </Card>
  );
}
