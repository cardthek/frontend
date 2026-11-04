"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FolderArchive,
  Images,
  Leaf,
  ShieldCheck,
  Sprout,
  Users,
} from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { CardPreview } from "@/components/cards/card-preview";
import { StatusBadge } from "@/components/cards/card-tile";
import { PageHeading } from "@/components/common/page-heading";
import { StatCard } from "@/components/common/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDemoStore, useDictionary } from "@/lib/demo-store";
import { themeName } from "@/lib/theme";
import { formatDate } from "@/lib/utils";

export default function AdminDashboardPage() {
  return (
    <AuthGuard permission="dashboard.read">
      <Dashboard />
    </AuthGuard>
  );
}

function Dashboard() {
  const { state, currentUser, can } = useDemoStore();
  const dictionary = useDictionary();
  const pending = state.cards.filter((card) => card.status === "pending");
  const published = state.cards.filter((card) => card.status === "published");
  const activeUsers = state.users.filter((user) => user.status === "active");
  const recentAudit = state.auditLogs.slice(0, 5);
  const statusRows = [
    { key: "published", label: "已发布", color: "bg-success" },
    { key: "pending", label: "待审核", color: "bg-warning" },
    { key: "changes_requested", label: "需修改", color: "bg-destructive" },
    { key: "draft", label: "草稿", color: "bg-muted-foreground" },
  ] as const;

  return (
    <div>
      <PageHeading
        eyebrow="Studio Overview"
        title={`早上好，${currentUser?.displayName ?? "管理员"}`}
        description="查看站点运行状态、待处理审核和最近的团队操作。所有数据来自当前演示会话。"
        actions={
          can("submissions.review") ? (
            <Button asChild><Link href="/admin/submissions">处理审核 <ArrowRight className="size-4" /></Link></Button>
          ) : (
            <Badge variant="outline">只读身份</Badge>
          )
        }
      />

      <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="待审核" value={pending.length} note="需要团队处理" icon={Clock3} />
        <StatCard label="公开卡片" value={published.length} note={`共 ${state.cards.length} 条档案`} icon={FolderArchive} />
        <StatCard label="活跃用户" value={activeUsers.length} note={`共 ${state.users.filter((user) => user.status !== "deleted").length} 个账号`} icon={Users} />
        <StatCard label="媒体资产" value={state.media.length} note="UUID 唯一标识" icon={Images} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
        <section className="paper-panel overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-border/70 p-5 md:p-6">
            <div><p className="label-caps">Review Queue</p><h2 className="mt-2 font-serif text-2xl font-bold">待审核投稿</h2></div>
            <Button asChild variant="ghost" size="sm"><Link href="/admin/submissions">查看全部 <ArrowRight className="size-3.5" /></Link></Button>
          </div>
          {pending.length ? (
            <div className="divide-y divide-border/70">
              {pending.slice(0, 4).map((card) => {
                const cover = state.media.find((asset) => asset.uuid === card.coverMediaId);
                const owner = state.users.find((user) => user.id === card.ownerId);
                return (
                  <div key={card.uuid} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center md:px-6">
                    <div className="w-full shrink-0 sm:w-32"><CardPreview card={card} media={cover} /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2"><StatusBadge status={card.status} /><span className="text-[0.65rem] text-muted-foreground">{formatDate(card.submittedAt ?? card.createdAt, true)}</span></div>
                      <h3 className="mt-2 truncate font-serif text-lg font-bold">{card.title}</h3>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{owner?.displayName ?? "未知用户"} · {dictionary(card.issuerId)} · {dictionary(card.networkId)}</p>
                    </div>
                    <Button asChild variant="outline" size="sm"><Link href="/admin/submissions">审核</Link></Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-10 text-center text-sm text-muted-foreground"><CheckCircle2 className="mx-auto mb-3 size-6 text-success" />审核队列已经清空。</div>
          )}
        </section>

        <div className="space-y-6">
          <section className="paper-panel p-5 md:p-6">
            <p className="label-caps">Archive Health</p>
            <h2 className="mt-2 font-serif text-2xl font-bold">档案状态</h2>
            <div className="mt-5 space-y-4">
              {statusRows.map((row) => {
                const count = state.cards.filter((card) => card.status === row.key).length;
                const percent = state.cards.length ? Math.round((count / state.cards.length) * 100) : 0;
                return (
                  <div key={row.key}>
                    <div className="flex items-center justify-between text-xs"><span className="font-semibold">{row.label}</span><span className="text-muted-foreground">{count} · {percent}%</span></div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-muted"><span className={`block h-full rounded-full ${row.color}`} style={{ width: `${percent}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-card border border-border bg-surface/55 p-5 md:p-6">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card text-secondary"><Leaf className="size-4" /></span>
              <div><p className="font-serif text-lg font-bold">演示环境</p><p className="mt-1 text-xs leading-5 text-muted-foreground">站点已初始化 · {state.settings.registrationMode === "open" ? "开放注册" : state.settings.registrationMode === "invite" ? "邀请注册" : "关闭注册"} · {state.settings.emailVerification ? "需要邮箱验证" : "无需邮箱验证"}</p></div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-ui bg-card p-3"><span className="text-muted-foreground">主题</span><p className="mt-1 font-semibold">{themeName(state.theme)}</p></div>
              <div className="rounded-ui bg-card p-3"><span className="text-muted-foreground">权限节点</span><p className="mt-1 font-semibold">{state.roles.reduce((sum, role) => sum + role.permissions.length, 0)} 项</p></div>
            </div>
          </section>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="paper-panel p-5 md:p-6">
          <div className="flex items-center justify-between gap-4"><div><p className="label-caps">Recent Activity</p><h2 className="mt-2 font-serif text-2xl font-bold">最近操作</h2></div>{can("audit.read") && <Button asChild variant="ghost" size="sm"><Link href="/admin/audit">全部日志</Link></Button>}</div>
          <div className="mt-5 divide-y divide-border/70">
            {recentAudit.map((log) => {
              const actor = state.users.find((user) => user.id === log.actorId);
              return <div key={log.id} className="flex gap-3 py-3.5"><span className="mt-1 size-2 shrink-0 rounded-full bg-secondary" /><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{log.detail}</p><p className="mt-1 text-[0.65rem] text-muted-foreground">{actor?.displayName ?? "系统"} · {log.action} · {formatDate(log.createdAt, true)}</p></div></div>;
            })}
          </div>
        </section>

        <section className="paper-panel p-5 md:p-6">
          <p className="label-caps">Permission Snapshot</p>
          <h2 className="mt-2 font-serif text-2xl font-bold">你的身份</h2>
          <div className="mt-5 space-y-3">
            {state.roles.filter((role) => currentUser?.roleIds.includes(role.id)).map((role) => (
              <div key={role.id} className="rounded-ui bg-surface p-3"><p className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="size-4 text-secondary" />{role.name}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{role.description}</p></div>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground"><Sprout className="size-4 text-secondary" />菜单和按钮会随权限实时变化</div>
        </section>
      </div>
    </div>
  );
}
