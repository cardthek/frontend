"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, toApiError } from "@/lib/api-client";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Card className="p-6 md:p-8">正在读取重置令牌…</Card>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!token) return toast.error("重置令牌缺失");
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      return toast.error("密码至少 8 个字符，并同时包含字母和数字");
    }
    if (password !== confirm) return toast.error("两次输入的密码不一致");
    setBusy(true);
    try {
      await apiRequest("/auth/reset-password", {
        method: "POST",
        auth: false,
        body: { token, newPassword: password },
      });
      toast.success("密码已重置，请重新登录");
      router.push("/login");
    } catch (error) {
      toast.error(toApiError(error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-6 md:p-8">
      <p className="label-caps">Reset Access</p>
      <h1 className="mt-3 font-serif text-3xl font-bold">设置新密码</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">重置令牌只能使用一次，修改成功后所有旧会话都会失效。</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div><Label htmlFor="password">新密码</Label><Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" /></div>
        <div><Label htmlFor="confirm">确认新密码</Label><Input id="confirm" type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} autoComplete="new-password" /></div>
        <Button type="submit" className="w-full" disabled={busy}><KeyRound className="size-4" />{busy ? "正在更新…" : "更新密码"}</Button>
      </form>
      <Button asChild variant="ghost" className="mt-4 w-full"><Link href="/login"><ArrowLeft className="size-4" />返回登录</Link></Button>
    </Card>
  );
}
