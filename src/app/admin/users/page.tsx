"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Ban, CheckCircle2, Pencil, Plus, Search, Trash2, UserRoundCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { AuthGuard } from "@/components/auth/auth-guard";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeading } from "@/components/common/page-heading";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAppStore } from "@/lib/app-store";
import { formatDate } from "@/lib/utils";

export default function AdminUsersPage() {
  return (
    <AuthGuard permission="users.read">
      <UserManagement />
    </AuthGuard>
  );
}

function UserManagement() {
  const { state, currentUser, can, updateUser, deleteUser } = useAppStore();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "suspended">("all");
  const [roleId, setRoleId] = useState("all");
  const canUpdate = can("users.update");
  const users = useMemo(() => state.users.filter((user) => {
    const haystack = `${user.displayName} ${user.username} ${user.email} ${user.slug}`.toLowerCase();
    return user.status !== "deleted" && haystack.includes(query.trim().toLowerCase()) && (status === "all" || user.status === status) && (roleId === "all" || user.roleIds.includes(roleId));
  }), [query, roleId, state.users, status]);
  const visibleUserCount = state.users.filter((user) => user.status !== "deleted").length;

  async function toggleStatus(userId: number, nextStatus: "active" | "suspended", name: string) {
    if (userId === currentUser?.id) {
      toast.error("不能停用当前登录账号");
      return;
    }
    if (nextStatus === "suspended" && !window.confirm(`确定停用「${name}」吗？该账号将无法登录。`)) return;
    try {
      await updateUser(userId, { status: nextStatus });
      toast.success(nextStatus === "active" ? "用户已启用" : "用户已停用");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "用户状态更新失败");
    }
  }

  async function removeUser(userId: number, name: string) {
    if (userId === currentUser?.id) {
      toast.error("不能删除当前登录账号");
      return;
    }
    if (!window.confirm(`确定删除用户「${name}」吗？此操作无法撤销。`)) return;
    const result = await deleteUser(userId);
    if (!result.ok) return toast.error(result.message);
    toast.success(result.message);
  }

  return (
    <div>
      <PageHeading eyebrow="People & Access" title="用户管理" description="查看账号状态与所属用户组。用户组分配统一在用户编辑页完成。" actions={<><Badge variant="outline"><Users className="size-3" />{visibleUserCount} 个账号</Badge>{canUpdate && <Button asChild><Link href="/admin/users/new"><Plus className="size-4" />新增用户</Link></Button>}</>} />

      <div className="mt-7 grid gap-3 rounded-card border border-border bg-surface/55 p-3 md:grid-cols-[minmax(0,1fr)_10rem_10rem]">
        <label className="relative"><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索用户名、邮箱、昵称或主页地址" className="bg-card pl-10" /></label>
        <Select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="bg-card"><option value="all">全部状态</option><option value="active">正常</option><option value="suspended">已停用</option></Select>
        <Select value={roleId} onChange={(event) => setRoleId(event.target.value)} className="bg-card"><option value="all">全部用户组</option>{state.roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</Select>
      </div>

      {users.length ? (
        <div className="mt-5 space-y-3">
          {users.map((user) => {
            const isSelf = user.id === currentUser?.id;
            const group = state.roles.find((role) => user.roleIds.includes(role.id));
            return (
              <article key={user.id} className="rounded-card border border-border bg-card p-4 md:p-5">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <Avatar name={user.displayName} tone={user.avatarTone} className="size-12 text-base" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-serif text-xl font-bold">{user.displayName}</h2>
                        <Badge variant="secondary">{group?.name ?? "未分组"}</Badge>
                        <Badge variant={user.status === "active" ? "success" : "destructive"}>{user.status === "active" ? "正常" : "已停用"}</Badge>
                        {isSelf && <Badge variant="secondary">当前账号</Badge>}
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">@{user.username} · {user.email} · ID {user.id}</p>
                      <p className="mt-1 truncate font-mono text-[0.62rem] text-muted-foreground">{user.uuid}</p>
                      <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted-foreground">{user.bio || "未填写个人简介"}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.65rem] text-muted-foreground">
                        <span>加入于 {formatDate(user.joinedAt)}</span>
                        <span>主页 /u/{user.slug}</span>
                        <span>投稿 {state.cards.filter((card) => card.ownerId === user.id).length} 条</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2 xl:w-36 xl:flex-col">
                    {canUpdate && <Button asChild variant="outline" size="sm"><Link href={`/admin/users/${user.uuid}/edit`}><Pencil className="size-4" />编辑</Link></Button>}
                    <Button asChild variant="outline" size="sm"><Link href={`/u/${user.slug}`}><UserRoundCheck className="size-4" />公开主页</Link></Button>
                    {canUpdate && (user.status === "active" ? <Button variant="ghost" size="sm" disabled={isSelf} onClick={() => toggleStatus(user.id, "suspended", user.displayName)} className="text-destructive hover:bg-destructive/10"><Ban className="size-4" />停用</Button> : <Button variant="outline" size="sm" onClick={() => toggleStatus(user.id, "active", user.displayName)}><CheckCircle2 className="size-4" />启用</Button>)}
                    {canUpdate && <Button variant="ghost" size="sm" disabled={isSelf} onClick={() => removeUser(user.id, user.displayName)} className="text-destructive hover:bg-destructive/10"><Trash2 className="size-4" />删除</Button>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-5"><EmptyState title="没有匹配的用户" description="尝试清除搜索条件或切换筛选。" action={<Button variant="outline" onClick={() => { setQuery(""); setStatus("all"); setRoleId("all"); }}>重置筛选</Button>} /></div>
      )}
    </div>
  );
}
