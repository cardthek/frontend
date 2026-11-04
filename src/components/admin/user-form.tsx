"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, AtSign, CheckCircle2, KeyRound, LoaderCircle, Save, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeading } from "@/components/common/page-heading";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/app-store";
import type { AdminUserInput, User } from "@/lib/types";
import {
  formatDate,
  isAsciiSlug,
  isNumericUsername,
  slugify,
} from "@/lib/utils";

const tones: User["avatarTone"][] = ["sand", "sage", "clay", "forest"];

export function AdminUserForm({ user }: { user?: User }) {
  const router = useRouter();
  const { state, currentUser, createUser, saveUser, deleteUser, changePassword } = useAppStore();
  const [form, setForm] = useState<AdminUserInput>({
    username: user?.username ?? "",
    email: user?.email ?? "",
    displayName: user?.displayName ?? "",
    slug: user?.slug ?? "",
    bio: user?.bio ?? "",
    avatarTone: user?.avatarTone ?? "sage",
    profileVisibility: user?.profileVisibility ?? "public",
    showSubmissions: user?.showSubmissions ?? true,
    roleIds: user?.roleIds.length ? [user.roleIds[0]] : ["member"],
    status: user?.status ?? "active",
    joinedAt: (user?.joinedAt ?? new Date().toISOString()).slice(0, 10),
  });
  const [slugTouched, setSlugTouched] = useState(Boolean(user));
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const isSelf = user?.id === currentUser?.id;
  const cardCount = user ? state.cards.filter((card) => card.ownerId === user.id).length : 0;
  const selectedRoleId = form.roleIds[0] ?? "";
  const selectedRole = state.roles.find((role) => role.id === selectedRoleId);

  function update<K extends keyof AdminUserInput>(field: K, value: AdminUserInput[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateDisplayName(value: string) {
    setForm((current) => ({
      ...current,
      displayName: value,
      slug: !slugTouched ? slugify(value) : current.slug,
    }));
  }

  function validate() {
    if (!form.displayName.trim()) return "请填写显示名称";
    if (!form.username.trim()) return "请填写用户名";
    if (isNumericUsername(form.username)) return "用户名不能是纯数字";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "请输入有效邮箱地址";
    if (!form.slug.trim()) return "请填写公开主页 slug";
    if (!isAsciiSlug(form.slug.trim().toLowerCase())) return "主页 slug 只能包含小写英文字母、数字和单个连字符";
    if (form.roleIds.length !== 1 || !selectedRole) return "请选择一个有效用户组";
    if (!form.joinedAt || Number.isNaN(new Date(`${form.joinedAt}T00:00:00.000Z`).getTime())) return "请选择有效加入日期";
    return null;
  }

  async function save() {
    const error = validate();
    if (error) return toast.error(error);
    if (!user) {
      if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) return toast.error("初始密码至少 8 个字符，并包含字母和数字");
      if (password !== confirmPassword) return toast.error("两次输入的初始密码不一致");
    }
    const input: AdminUserInput = {
      ...form,
      username: form.username.trim(),
      email: form.email.trim().toLowerCase(),
      displayName: form.displayName.trim(),
      slug: form.slug.trim().toLowerCase(),
      bio: form.bio.trim(),
      roleIds: [selectedRoleId],
      joinedAt: new Date(`${form.joinedAt}T00:00:00.000Z`).toISOString(),
      ...(!user ? { password } : {}),
    };
    setBusy(true);
    if (user) {
      const result = await saveUser(user.id, input);
      if (!result.ok) {
        setBusy(false);
        return toast.error(result.message);
      }
      toast.success(result.message);
      router.push("/admin/users");
    } else {
      const result = await createUser(input);
      if (!result.ok) {
        setBusy(false);
        return toast.error(result.message);
      }
      toast.success(result.message);
      router.push(result.uuid ? `/admin/users/${result.uuid}/edit` : "/admin/users");
    }
    setBusy(false);
  }

  async function updatePassword() {
    if (!user) return;
    if (password.length < 8) return toast.error("密码至少需要 8 个字符");
    if (password !== confirmPassword) return toast.error("两次输入的密码不一致");
    setPasswordBusy(true);
    const result = await changePassword(user.id, password);
    setPasswordBusy(false);
    if (!result.ok) return toast.error(result.message);
    setPassword("");
    setConfirmPassword("");
    toast.success(result.message);
  }

  async function removeUser() {
    if (!user) return;
    if (isSelf) return toast.error("不能删除当前登录账号");
    if (!window.confirm(`确定删除用户「${user.displayName}」吗？此操作无法撤销。`)) return;
    const result = await deleteUser(user.id);
    if (!result.ok) return toast.error(result.message);
    toast.success(result.message);
    router.push("/admin/users");
  }

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-5 px-0"><Link href="/admin/users"><ArrowLeft className="size-4" />返回用户管理</Link></Button>
      <PageHeading
        eyebrow={user ? "Edit User" : "New User"}
        title={user ? `编辑：${user.displayName}` : "新增用户"}
        description={user ? "编辑账号资料、用户组、状态、公开主页设置与账号安全。" : "由管理员直接创建账号，并选择初始用户组与主页可见性。"}
        actions={<div className="flex flex-wrap items-center gap-2">{user && <Badge variant={user.status === "active" ? "success" : "destructive"}>{user.status === "active" ? "正常" : "已停用"}</Badge>}{isSelf && <Badge variant="secondary">当前账号</Badge>}{user && <Button variant="destructive" size="sm" onClick={removeUser} disabled={isSelf}><Trash2 className="size-4" />删除用户</Button>}<Button onClick={save} disabled={busy}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}保存用户</Button></div>}
      />

      <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
        <div className="space-y-5">
          <section className="paper-panel p-5 md:p-7">
            <div><p className="label-caps">Account Identity</p><h2 className="mt-2 font-serif text-2xl font-bold">账号资料</h2></div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div><Label htmlFor="displayName">显示名称 *</Label><Input id="displayName" value={form.displayName} onChange={(event) => updateDisplayName(event.target.value)} placeholder="例如：林屿" /></div>
              <div><Label htmlFor="username">用户名 *</Label><div className="relative"><AtSign className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="username" value={form.username} onChange={(event) => update("username", event.target.value)} className="pl-10" placeholder="例如：lin" /></div><p className="mt-2 text-[0.65rem] text-muted-foreground">不能是纯数字，用于登录和 @ 展示。</p></div>
              <div><Label htmlFor="email">邮箱 *</Label><Input id="email" type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="name@example.com" /></div>
              <div><Label htmlFor="slug">公开主页 slug *</Label><Input id="slug" value={form.slug} onChange={(event) => { setSlugTouched(true); update("slug", event.target.value); }} placeholder="例如：lin-yu" /><p className="mt-2 text-[0.65rem] text-muted-foreground">仅限小写 ASCII 字母、数字和单连字符。公开地址：/u/{form.slug || "your-slug"}</p></div>
              <div className="sm:col-span-2"><Label htmlFor="bio">个人简介</Label><Textarea id="bio" value={form.bio} onChange={(event) => update("bio", event.target.value)} placeholder="介绍收藏偏好、研究主题或与卡片相关的经历。" /></div>
            </div>
            <p className="mt-4 rounded-ui bg-surface px-4 py-3 text-xs leading-5 text-muted-foreground">密码会由后端进行安全哈希存储；后台创建用户时必须设置初始密码。</p>
          </section>

          <section className="paper-panel p-5 md:p-7">
            <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-full bg-surface text-secondary"><ShieldCheck className="size-4" /></span><div><p className="label-caps">Access Control</p><h2 className="mt-1 font-serif text-2xl font-bold">用户组与账号状态</h2></div></div>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div><Label htmlFor="status">账号状态</Label><Select id="status" value={form.status} onChange={(event) => update("status", event.target.value as User["status"])}><option value="active">正常</option><option value="suspended">已停用</option></Select><p className="mt-2 text-[0.65rem] text-muted-foreground">停用账号无法通过登录页登录。</p></div>
              <div><Label htmlFor="joinedAt">加入日期</Label><Input id="joinedAt" type="date" value={form.joinedAt} onChange={(event) => update("joinedAt", event.target.value)} /></div>
            </div>
            <div className="mt-5 rounded-ui border border-border bg-surface/35 p-4">
              <Label htmlFor="roleId">用户组 *</Label>
              <Select id="roleId" value={selectedRoleId} onChange={(event) => update("roleIds", [event.target.value])}>
                {state.roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
              </Select>
              <p className="mt-2 text-[0.68rem] leading-5 text-muted-foreground">{selectedRole?.description ?? "请选择一个用户组。"}</p>
              {isSelf && <p className="mt-3 rounded-ui border border-warning/25 bg-warning/10 px-3 py-2 text-xs leading-5 text-warning">你正在编辑当前登录账号。修改用户组会立即影响后台菜单和操作权限。</p>}
            </div>
          </section>

          <section className="paper-panel p-5 md:p-7">
            <div><p className="label-caps">Public Profile</p><h2 className="mt-2 font-serif text-2xl font-bold">公开主页设置</h2></div>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div><Label htmlFor="profileVisibility">主页可见性</Label><Select id="profileVisibility" value={form.profileVisibility} onChange={(event) => update("profileVisibility", event.target.value as User["profileVisibility"])}><option value="public">所有人可见</option><option value="authenticated">仅登录用户</option><option value="private">仅自己</option></Select></div>
              <div><Label htmlFor="avatarTone">头像色调</Label><Select id="avatarTone" value={form.avatarTone} onChange={(event) => update("avatarTone", event.target.value as User["avatarTone"])}>{tones.map((tone) => <option key={tone} value={tone}>{tone === "sand" ? "砂色" : tone === "sage" ? "鼠尾草" : tone === "clay" ? "陶土" : "森林"}</option>)}</Select></div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-4 rounded-ui bg-surface p-4"><div><p className="text-sm font-semibold">在主页展示投稿</p><p className="mt-1 text-xs leading-5 text-muted-foreground">关闭后，其他访客不会看到该用户的卡片投稿列表。</p></div><Switch checked={form.showSubmissions} onCheckedChange={(checked) => update("showSubmissions", checked)} /></div>
          </section>

          <section className="paper-panel p-5 md:p-7">
            <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-full bg-surface text-secondary"><KeyRound className="size-4" /></span><div><p className="label-caps">Account Security</p><h2 className="mt-1 font-serif text-2xl font-bold">修改密码</h2></div></div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div><Label htmlFor="newPassword">{user ? "新密码" : "初始密码"}</Label><Input id="newPassword" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="至少 8 个字符" autoComplete="new-password" /></div>
              <div><Label htmlFor="confirmPassword">确认密码</Label><Input id="confirmPassword" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="再次输入密码" autoComplete="new-password" /></div>
            </div>
            <div className="mt-4 flex flex-col gap-3 rounded-ui bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-muted-foreground">{user ? `修改密码会使该用户的其他会话失效。上次更新：${user.passwordUpdatedAt ? formatDate(user.passwordUpdatedAt, true) : "未记录"}` : "创建用户时会同时保存初始密码。"}</p>{user && <Button type="button" variant="outline" size="sm" onClick={() => void updatePassword()} disabled={passwordBusy}>{passwordBusy ? <LoaderCircle className="size-4 animate-spin" /> : <KeyRound className="size-4" />}更新密码</Button>}</div>
          </section>

          <div className="sticky bottom-4 z-10 flex flex-col-reverse gap-3 rounded-card border border-border bg-card/95 p-3 shadow-float backdrop-blur sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-2"><Button asChild variant="ghost"><Link href="/admin/users">取消</Link></Button>{user && <Button variant="ghost" onClick={removeUser} disabled={isSelf} className="text-destructive hover:bg-destructive/10"><Trash2 className="size-4" />删除用户</Button>}</div><Button onClick={save} disabled={busy}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}保存用户</Button></div>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <div className="rounded-card border border-border bg-surface p-5 text-center"><Avatar name={form.displayName || "新用户"} tone={form.avatarTone} className="mx-auto size-20 text-2xl" /><h2 className="mt-4 font-serif text-2xl font-bold">{form.displayName || "未命名用户"}</h2><p className="mt-1 font-mono text-xs text-muted-foreground">@{form.username || "username"}</p><p className="mt-3 text-xs leading-6 text-muted-foreground">{form.bio || "尚未填写个人简介"}</p><div className="mt-4 flex flex-wrap justify-center gap-2"><Badge variant="secondary">{selectedRole?.name ?? "未选择用户组"}</Badge><Badge variant="outline">{form.profileVisibility === "public" ? "公开主页" : form.profileVisibility === "authenticated" ? "登录可见" : "仅自己"}</Badge><Badge variant={form.status === "active" ? "success" : "destructive"}>{form.status === "active" ? "正常" : "停用"}</Badge></div></div>
          {user && <div className="rounded-card border border-border bg-card p-4"><p className="label-caps">System Metadata</p><dl className="mt-3 space-y-3 text-xs"><MetaRow label="数字 ID" value={String(user.id)} /><MetaRow label="用户 UUID" value={user.uuid} mono /><MetaRow label="加入时间" value={formatDate(user.joinedAt, true)} /><MetaRow label="投稿数量" value={`${cardCount} 条`} /><MetaRow label="密码更新" value={user.passwordUpdatedAt ? formatDate(user.passwordUpdatedAt, true) : "未记录"} /></dl></div>}
          <div className="rounded-card border border-border bg-card p-4"><p className="flex items-center gap-2 text-sm font-semibold"><CheckCircle2 className="size-4 text-success" />账号提示</p><ul className="mt-3 space-y-2 text-xs leading-5 text-muted-foreground"><li>用户名、邮箱和主页 slug 必须唯一。</li><li>用户组为单选，并决定后台权限。</li><li>删除账号后，其卡片继续保留并显示“账号已注销”。</li><li>停用账号不会删除卡片和审计记录。</li></ul></div>
        </aside>
      </div>
    </div>
  );
}

function MetaRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div><dt className="text-muted-foreground">{label}</dt><dd className={`mt-1 break-all font-semibold ${mono ? "font-mono text-[0.62rem]" : ""}`}>{value}</dd></div>;
}
