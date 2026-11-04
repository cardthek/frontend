"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, AtSign, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/app-store";
import { isNumericUsername } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const { state, register } = useAppStore();
  const [form, setForm] = useState({ username: "", email: "", displayName: "", password: "", confirm: "", terms: false });
  const [submitting, setSubmitting] = useState(false);
  const closed = state.settings.registrationMode !== "open";

  function update(field: keyof typeof form, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (closed) return;
    if (isNumericUsername(form.username)) return toast.error("用户名不能是纯数字");
    if (!form.username.trim() || !form.email.trim() || !form.password) return toast.error("请填写必填项");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return toast.error("请输入有效邮箱");
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) return toast.error("密码至少 8 个字符，并同时包含字母和数字");
    if (form.password !== form.confirm) return toast.error("两次输入的密码不一致");
    if (!form.terms) return toast.error("请先同意投稿与隐私规则");
    setSubmitting(true);
    const result = await register({ username: form.username, email: form.email, displayName: form.displayName, password: form.password });
    setSubmitting(false);
    if (!result.ok) return toast.error(result.message);
    toast.success(result.message);
    router.push("/me/profile");
  }

  return (
    <Card className="p-6 md:p-8">
      <p className="label-caps">Join The Archive</p>
      <h1 className="mt-3 font-serif text-3xl font-bold">加入 cardthek</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">创建收藏者账号，记录并投稿银行卡卡面设计。</p>

      {closed ? (
        <div className="mt-6 rounded-ui border border-border bg-surface p-5 text-sm leading-7 text-muted-foreground">
          {state.settings.registrationMode === "invite" ? "当前站点仅支持邀请注册，请联系管理员获取邀请。" : "当前站点已关闭注册，请联系站点管理员。"}
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div><Label htmlFor="username">用户名 *</Label><div className="relative"><AtSign className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="username" value={form.username} onChange={(event) => update("username", event.target.value)} className="pl-10" placeholder="不能是纯数字" autoComplete="username" /></div></div>
          <div><Label htmlFor="displayName">显示名称</Label><Input id="displayName" value={form.displayName} onChange={(event) => update("displayName", event.target.value)} placeholder="将展示在主页" /></div>
          <div><Label htmlFor="email">邮箱 *</Label><Input id="email" type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="you@example.com" autoComplete="email" /></div>
          <div><Label htmlFor="password">密码 *</Label><div className="relative"><KeyRound className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="password" type="password" value={form.password} onChange={(event) => update("password", event.target.value)} className="pl-10" placeholder="至少 8 个字符" autoComplete="new-password" /></div></div>
          <div><Label htmlFor="confirm">确认密码 *</Label><Input id="confirm" type="password" value={form.confirm} onChange={(event) => update("confirm", event.target.value)} placeholder="再次输入" autoComplete="new-password" /></div>
          <label className="flex items-start gap-2.5 text-xs leading-5 text-muted-foreground">
            <input type="checkbox" checked={form.terms} onChange={(event) => update("terms", event.target.checked)} className="mt-1 accent-[var(--primary)]" />
            <span>我同意投稿规则，并确认不会上传卡号、有效期、安全码等支付信息。</span>
          </label>
          <Button type="submit" className="w-full" disabled={submitting}>{submitting ? "正在创建…" : "创建账号"} <ArrowRight className="size-4" /></Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">已有账号？ <Link href="/login" className="font-semibold text-primary hover:underline">返回登录</Link></p>
    </Card>
  );
}
