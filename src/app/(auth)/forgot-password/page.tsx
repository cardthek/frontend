"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MailCheck, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error("请输入有效邮箱");
    setSent(true);
  }

  return (
    <Card className="p-6 md:p-8">
      {sent ? (
        <div className="py-6 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-surface text-secondary"><MailCheck className="size-6" /></span>
          <h1 className="mt-5 font-serif text-3xl font-bold">检查你的邮箱</h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">演示流程已模拟发送重置链接至 <strong className="text-foreground">{email}</strong>。正式版本将由后端生成一次性令牌。</p>
          <Button asChild variant="outline" className="mt-6"><Link href="/login">返回登录</Link></Button>
        </div>
      ) : (
        <>
          <p className="label-caps">Recover Access</p>
          <h1 className="mt-3 font-serif text-3xl font-bold">找回密码</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">输入注册邮箱。演示模式只会模拟发送成功，不会发出真实邮件。</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div><Label htmlFor="email">注册邮箱</Label><Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" /></div>
            <Button type="submit" className="w-full">发送重置链接 <Send className="size-4" /></Button>
          </form>
          <Button asChild variant="ghost" className="mt-4 w-full"><Link href="/login"><ArrowLeft className="size-4" />返回登录</Link></Button>
        </>
      )}
    </Card>
  );
}
