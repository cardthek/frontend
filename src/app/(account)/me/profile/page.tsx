"use client";

import { useState } from "react";
import Link from "next/link";
import { AtSign, ExternalLink, KeyRound, Save, Shield, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { profileVisibilityLabel, useAppStore } from "@/lib/app-store";
import type { ProfileVisibility } from "@/lib/types";
import { isAsciiSlug } from "@/lib/utils";

export default function ProfilePage() {
  const { currentUser, state, updateProfile } = useAppStore();
  const [form, setForm] = useState(() => ({
    displayName: currentUser?.displayName ?? "",
    username: currentUser?.username ?? "",
    email: currentUser?.email ?? "",
    slug: currentUser?.slug ?? "",
    bio: currentUser?.bio ?? "",
    avatarTone: currentUser?.avatarTone ?? "sage" as const,
    profileVisibility: currentUser?.profileVisibility ?? "public" as ProfileVisibility,
    showSubmissions: currentUser?.showSubmissions ?? true,
  }));
  if (!currentUser) return null;
  const roles = state.roles.filter((role) => currentUser.roleIds.includes(role.id));

  function update<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const slug = (form.slug || form.username).trim().toLowerCase();
    if (!isAsciiSlug(slug)) return toast.error("主页 slug 只能包含小写英文字母、数字和单个连字符");
    const result = await updateProfile({
      displayName: form.displayName,
      slug,
      bio: form.bio,
      avatarTone: form.avatarTone,
      profileVisibility: form.profileVisibility,
      showSubmissions: form.showSubmissions,
    });
    if (!result.ok) return toast.error(result.message);
    setForm((current) => ({ ...current, slug }));
    toast.success(result.message);
  }

  return (
    <div>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="label-caps mb-3">Account Profile</p><h1 className="section-title">个人资料</h1><p className="mt-3 text-sm leading-7 text-muted-foreground">维护公开主页、账号标识与投稿展示偏好。</p></div>
        <Button asChild variant="outline"><Link href={`/u/${currentUser.slug}`}><ExternalLink className="size-4" />查看公开主页</Link></Button>
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_19rem] xl:items-start">
        <form onSubmit={save} className="rounded-card border border-border bg-card p-5 md:p-7">
          <div className="flex flex-col gap-4 border-b border-border/70 pb-6 sm:flex-row sm:items-center">
            <Avatar name={form.displayName || form.username} tone={form.avatarTone} className="size-16 text-xl" />
            <div><p className="font-serif text-xl font-bold">{form.displayName || "未命名用户"}</p><p className="mt-1 text-xs text-muted-foreground">@{form.username} · 用户 ID {currentUser.id}</p><div className="mt-2 flex flex-wrap gap-1.5">{roles.map((role) => <Badge key={role.id} variant="outline">{role.name}</Badge>)}</div></div>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div><Label htmlFor="displayName">显示名称</Label><Input id="displayName" value={form.displayName} onChange={(event) => update("displayName", event.target.value)} /></div>
            <div><Label htmlFor="username">用户名</Label><div className="relative"><AtSign className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="username" value={form.username} disabled className="pl-10" /></div><p className="mt-1.5 text-[0.65rem] text-muted-foreground">用户名由管理员在用户编辑页修改。</p></div>
            <div><Label htmlFor="email">邮箱</Label><Input id="email" type="email" value={form.email} disabled /><p className="mt-1.5 text-[0.65rem] text-muted-foreground">邮箱由管理员在用户编辑页修改。</p></div>
            <div><Label htmlFor="slug">主页地址</Label><div className="flex items-center rounded-pill border border-input bg-card pl-4"><span className="text-xs text-muted-foreground">/u/</span><input id="slug" value={form.slug} onChange={(event) => update("slug", event.target.value)} className="h-11 min-w-0 flex-1 bg-transparent px-1 text-sm outline-none" /></div><p className="mt-1.5 text-[0.65rem] text-muted-foreground">仅限小写 ASCII 字母、数字和单连字符。</p></div>
          </div>

          <div className="mt-5"><Label htmlFor="bio">个人简介</Label><Textarea id="bio" value={form.bio} onChange={(event) => update("bio", event.target.value)} maxLength={180} /><p className="mt-1.5 text-right text-[0.65rem] text-muted-foreground">{form.bio.length} / 180</p></div>

          <div className="mt-5">
            <Label>头像色调</Label>
            <div className="flex flex-wrap gap-2">
              {(["sand", "sage", "clay", "forest"] as const).map((tone) => <button type="button" key={tone} onClick={() => update("avatarTone", tone)} className={`rounded-pill border p-1 ${form.avatarTone === tone ? "border-primary" : "border-transparent"}`} aria-label={`选择 ${tone} 头像`}><Avatar name={form.displayName || form.username} tone={tone} /></button>)}
            </div>
          </div>

          <div className="mt-7 grid gap-5 border-t border-border/70 pt-6 sm:grid-cols-2">
            <div><Label htmlFor="visibility">主页可见范围</Label><Select id="visibility" value={form.profileVisibility} onChange={(event) => update("profileVisibility", event.target.value as ProfileVisibility)}><option value="public">所有人可见</option><option value="authenticated">登录后可见</option><option value="private">仅自己可见</option></Select><p className="mt-1.5 text-[0.65rem] text-muted-foreground">{profileVisibilityLabel(form.profileVisibility)}</p></div>
            <div><Label>公开投稿列表</Label><div className="flex h-11 items-center justify-between rounded-pill border border-input bg-card px-4"><span className="text-xs text-muted-foreground">在主页展示我的卡片</span><Switch checked={form.showSubmissions} onCheckedChange={(checked) => update("showSubmissions", checked)} /></div></div>
          </div>

          <div className="mt-7 flex justify-end border-t border-border/70 pt-5"><Button type="submit"><Save className="size-4" />保存资料</Button></div>
        </form>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <div className="rounded-card border border-border bg-surface p-5">
            <p className="flex items-center gap-2 text-sm font-semibold"><Shield className="size-4 text-secondary" />账号与权限</p>
            <dl className="mt-4 space-y-3 text-xs"><div className="flex justify-between gap-3"><dt className="text-muted-foreground">稳定 UUID</dt><dd className="truncate font-mono">{currentUser.uuid.slice(0, 12)}…</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">账号状态</dt><dd className="font-semibold text-success">正常</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">角色数量</dt><dd className="font-semibold">{roles.length}</dd></div></dl>
            <div className="mt-4 flex flex-wrap gap-1.5">{roles.flatMap((role) => role.permissions.slice(0, 3).map((permission) => <Badge key={`${role.id}-${permission}`} variant="outline">{permission}</Badge>))}</div>
          </div>
          <div className="rounded-card border border-border bg-card p-5">
            <p className="flex items-center gap-2 text-sm font-semibold"><KeyRound className="size-4 text-secondary" />账号安全</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">密码通过后端接口安全更新，更新后其他会话会立即失效。</p>
            <Button asChild variant="outline" size="sm" className="mt-4 w-full"><Link href="/forgot-password">修改密码</Link></Button>
          </div>
          <div className="rounded-card border border-border bg-card p-5">
            <p className="flex items-center gap-2 text-sm font-semibold"><UserRound className="size-4 text-secondary" />身份说明</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">用户名或邮箱都可以登录；数字 ID 只用于内部关联，公开 URL 使用可编辑的 slug。</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
