"use client";

import { useMemo, useState } from "react";
import { Activity, Search, ShieldCheck } from "lucide-react";
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

const resourceLabels: Record<string, string> = {
  card: "卡片",
  user: "用户",
  role: "角色",
  dictionary: "字典",
  site_settings: "站点设置",
  site: "站点",
  media: "媒体",
};

export default function AdminAuditPage() {
  return (
    <AuthGuard permission="audit.read">
      <AuditLogPage />
    </AuthGuard>
  );
}

function AuditLogPage() {
  const { state } = useAppStore();
  const [query, setQuery] = useState("");
  const [resource, setResource] = useState("all");
  const [action, setAction] = useState("all");
  const resources = Array.from(new Set(state.auditLogs.map((log) => log.resourceType)));
  const actions = Array.from(new Set(state.auditLogs.map((log) => log.action))).sort();
  const logs = useMemo(() => state.auditLogs.filter((log) => {
    const actor = state.users.find((user) => user.id === log.actorId);
    const haystack = `${log.detail} ${log.action} ${log.resourceId} ${actor?.displayName ?? ""}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase()) && (resource === "all" || log.resourceType === resource) && (action === "all" || log.action === action);
  }), [action, query, resource, state.auditLogs, state.users]);

  return (
    <div>
      <PageHeading eyebrow="Audit Trail" title="审计日志" description="追踪内容、权限、用户与站点设置的关键操作。日志由后端持久化并按时间倒序排列。" actions={<Badge variant="outline"><ShieldCheck className="size-3" />{state.auditLogs.length} 条事件</Badge>} />

      <div className="mt-7 grid gap-3 rounded-card border border-border bg-surface/55 p-3 lg:grid-cols-[minmax(0,1fr)_11rem_13rem]">
        <label className="relative"><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索详情、操作标识、资源 ID 或操作者" className="bg-card pl-10" /></label>
        <Select value={resource} onChange={(event) => setResource(event.target.value)} className="bg-card"><option value="all">全部资源</option>{resources.map((item) => <option key={item} value={item}>{resourceLabels[item] ?? item}</option>)}</Select>
        <Select value={action} onChange={(event) => setAction(event.target.value)} className="bg-card"><option value="all">全部操作</option>{actions.map((item) => <option key={item} value={item}>{item}</option>)}</Select>
      </div>

      {logs.length ? (
        <div className="mt-5 overflow-hidden rounded-card border border-border bg-card">
          <div className="hidden grid-cols-[11rem_minmax(0,1fr)_10rem_13rem] gap-4 border-b border-border/70 bg-surface/60 px-5 py-3 text-[0.62rem] font-bold tracking-wider text-muted-foreground md:grid"><span>操作者</span><span>事件</span><span>资源</span><span>时间</span></div>
          <div className="divide-y divide-border/70">
            {logs.map((log) => {
              const actor = state.users.find((user) => user.id === log.actorId);
              return (
                <div key={log.id} className="grid gap-3 px-4 py-4 md:grid-cols-[11rem_minmax(0,1fr)_10rem_13rem] md:items-center md:gap-4 md:px-5">
                  <div className="flex items-center gap-2.5">{actor ? <Avatar name={actor.displayName} tone={actor.avatarTone} className="size-8 text-[0.65rem]" /> : <span className="flex size-8 items-center justify-center rounded-full bg-surface text-muted-foreground"><Activity className="size-3.5" /></span>}<div className="min-w-0"><p className="truncate text-xs font-semibold">{actor?.displayName ?? "系统"}</p><p className="truncate text-[0.6rem] text-muted-foreground">{actor ? `@${actor.username}` : "system"}</p></div></div>
                  <div className="min-w-0"><p className="text-sm font-semibold">{log.detail}</p><p className="mt-1 break-all font-mono text-[0.6rem] text-muted-foreground">{log.action} · {log.resourceId}</p></div>
                  <div><Badge variant="outline">{resourceLabels[log.resourceType] ?? log.resourceType}</Badge></div>
                  <p className="text-[0.65rem] text-muted-foreground">{formatDate(log.createdAt, true)}</p>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-5"><EmptyState title="没有匹配的审计事件" description="尝试调整搜索词、资源类型或操作筛选。" action={<Button variant="outline" onClick={() => { setQuery(""); setResource("all"); setAction("all"); }}>重置筛选</Button>} /></div>
      )}
    </div>
  );
}
