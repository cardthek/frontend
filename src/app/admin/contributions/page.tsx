"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, ExternalLink, GitPullRequest, X } from "lucide-react";
import { toast } from "sonner";
import { AuthGuard } from "@/components/auth/auth-guard";
import { CardPreview } from "@/components/cards/card-preview";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeading } from "@/components/common/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { countryName } from "@/data/countries";
import { currencyName } from "@/data/currencies";
import { useDemoStore, useDictionary } from "@/lib/demo-store";
import type { CardContribution, ContributionChanges } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

const statusOptions = [
  { value: "pending", label: "待审核" },
  { value: "approved", label: "已通过" },
  { value: "rejected", label: "已拒绝" },
  { value: "all", label: "全部" },
] as const;

const contributionFields: Array<{ key: keyof ContributionChanges; label: string; dictionary?: boolean; country?: boolean; currency?: boolean }> = [
  { key: "title", label: "卡片标题" },
  { key: "bin", label: "卡 BIN" },
  { key: "issuerId", label: "发行方", dictionary: true },
  { key: "networkId", label: "卡组织", dictionary: true },
  { key: "cardTypeId", label: "卡片类型", dictionary: true },
  { key: "levelId", label: "卡片等级", dictionary: true },
  { key: "countryCode", label: "国家 / 地区", country: true },
  { key: "currencyCodes", label: "币种", currency: true },
  { key: "releaseYear", label: "发行年份" },
  { key: "tags", label: "设计标签" },
  { key: "description", label: "卡面介绍" },
  { key: "sourceUrl", label: "资料来源" },
];

export default function AdminContributionsPage() {
  return <AuthGuard permission="submissions.review"><ContributionReview /></AuthGuard>;
}

function ContributionReview() {
  const { state, reviewContribution } = useDemoStore();
  const dictionary = useDictionary();
  const [filter, setFilter] = useState<(typeof statusOptions)[number]["value"]>("pending");
  const [selectedId, setSelectedId] = useState(state.contributions.find((item) => item.status === "pending")?.id);
  const [comment, setComment] = useState("");
  const contributions = useMemo(() => state.contributions.filter((item) => filter === "all" || item.status === filter), [filter, state.contributions]);
  const selected = state.contributions.find((item) => item.id === selectedId) ?? contributions[0];
  const card = selected ? state.cards.find((item) => item.uuid === selected.cardUuid) : undefined;
  const contributor = selected ? state.users.find((user) => user.id === selected.contributorId) : undefined;
  const pendingCount = state.contributions.filter((item) => item.status === "pending").length;

  function formatValue(field: typeof contributionFields[number], value: ContributionChanges[keyof ContributionChanges]) {
    if (value === undefined || value === null || value === "") return "未填写";
    if (field.dictionary) return dictionary(String(value));
    if (field.country) return `${countryName(String(value))} · ${String(value)}`;
    if (field.currency) return (value as string[]).map((code) => code === "*" ? "全币种" : `${currencyName(code)} · ${code}`).join("、");
    if (Array.isArray(value)) return value.join("、");
    return String(value);
  }

  function currentValue(field: typeof contributionFields[number]) {
    if (!card) return undefined;
    return card[field.key as keyof typeof card] as ContributionChanges[keyof ContributionChanges];
  }

  function decide(decision: "approved" | "rejected") {
    if (!selected) return;
    if (decision === "rejected" && !comment.trim()) return toast.error("拒绝时请填写审核意见");
    const result = reviewContribution(selected.id, decision, comment.trim());
    if (!result.ok) return toast.error(result.message);
    toast.success(result.message);
    setComment("");
    const next = state.contributions.find((item) => item.id !== selected.id && item.status === "pending");
    setSelectedId(next?.id);
  }

  return (
    <div>
      <PageHeading eyebrow="Collaborative Review" title="协作审核" description="审核其他用户对卡片提交的补充与纠错。通过后会更新卡片，并把提交者加入档案贡献者。" actions={<Badge variant={pendingCount ? "warning" : "success"}><GitPullRequest className="size-3" />{pendingCount} 条待处理</Badge>} />
      <div className="mt-7 grid gap-5 xl:grid-cols-[21rem_minmax(0,1fr)]">
        <aside>
          <div className="no-scrollbar mb-3 flex gap-1.5 overflow-x-auto pb-1">
            {statusOptions.map((item) => <button key={item.value} onClick={() => setFilter(item.value)} className={cn("whitespace-nowrap rounded-pill px-3 py-2 text-[0.68rem] font-semibold", filter === item.value ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground")}>{item.label}</button>)}
          </div>
          <div className="space-y-2">
            {contributions.length ? contributions.map((item) => <ContributionQueueItem key={item.id} contribution={item} selected={selected?.id === item.id} onSelect={() => { setSelectedId(item.id); setComment(""); }} />) : <EmptyState title="没有记录" description="当前筛选条件下没有协作修改。" />}
          </div>
        </aside>

        {selected && card ? (
          <section className="paper-panel overflow-hidden">
            <div className="border-b border-border/70 p-5 md:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div><div className="flex flex-wrap items-center gap-2"><StatusContribution status={selected.status} /><span className="font-mono text-[0.62rem] text-muted-foreground">{selected.id.slice(0, 8)}</span></div><h2 className="mt-3 font-serif text-2xl font-bold">{card.title}</h2><p className="mt-2 text-xs text-muted-foreground">提交者 {contributor?.displayName ?? "未知用户"} · {formatDate(selected.createdAt, true)}</p></div>
                <Button asChild variant="outline" size="sm"><Link href={`/cards/${card.uuid}`}><ExternalLink className="size-4" />查看卡片</Link></Button>
              </div>
            </div>
            <div className="grid gap-6 p-5 md:p-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
              <div><CardPreview card={card} media={state.media.find((asset) => asset.uuid === card.coverMediaId)} /><div className="mt-4 rounded-ui bg-surface p-3"><p className="text-xs font-semibold">修改说明</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{selected.note}</p></div></div>
              <div>
                <p className="label-caps">Proposed Changes</p>
                <div className="mt-3 space-y-2">
                  {contributionFields.filter((field) => Object.prototype.hasOwnProperty.call(selected.changes, field.key)).map((field) => (
                    <div key={field.key} className="rounded-ui border border-border bg-surface/35 p-3">
                      <p className="text-xs font-semibold">{field.label}</p>
                      <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2"><div className="rounded-ui bg-card p-2"><p className="text-[0.6rem] text-muted-foreground">当前</p><p className="mt-1 break-words">{formatValue(field, currentValue(field))}</p></div><div className="rounded-ui bg-card p-2"><p className="text-[0.6rem] text-secondary">建议</p><p className="mt-1 break-words">{formatValue(field, selected.changes[field.key])}</p></div></div>
                    </div>
                  ))}
                </div>
                {selected.status === "pending" ? <div className="mt-5 rounded-card border border-border bg-surface/55 p-4"><p className="text-sm font-semibold">审核决定</p><Textarea className="mt-3 bg-card" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="通过时可选；拒绝时必填。" /><div className="mt-3 flex justify-end gap-2"><Button variant="destructive" size="sm" onClick={() => decide("rejected")}><X className="size-4" />拒绝</Button><Button size="sm" onClick={() => decide("approved")}><Check className="size-4" />通过并合并</Button></div></div> : <div className="mt-5 rounded-ui bg-surface p-3 text-xs text-muted-foreground">审核结果：{selected.status === "approved" ? "已通过" : "已拒绝"}{selected.reviewComment ? ` · ${selected.reviewComment}` : ""}</div>}
              </div>
            </div>
          </section>
        ) : <EmptyState title="选择一条协作修改" description="从左侧选择记录以查看字段差异并审核。" />}
      </div>
    </div>
  );
}

function ContributionQueueItem({ contribution, selected, onSelect }: { contribution: CardContribution; selected: boolean; onSelect: () => void }) {
  const { state } = useDemoStore();
  const card = state.cards.find((item) => item.uuid === contribution.cardUuid);
  const contributor = state.users.find((user) => user.id === contribution.contributorId);
  return <button onClick={onSelect} className={cn("w-full rounded-card border p-3 text-left", selected ? "border-primary bg-surface" : "border-border bg-card hover:bg-surface/60")}><div className="flex items-center justify-between gap-2"><StatusContribution status={contribution.status} /><span className="text-[0.6rem] text-muted-foreground">{formatDate(contribution.createdAt)}</span></div><p className="mt-2 truncate font-serif text-sm font-bold">{card?.title ?? "卡片不存在"}</p><p className="mt-1 truncate text-[0.65rem] text-muted-foreground">{contributor?.displayName ?? "未知用户"} · {Object.keys(contribution.changes).length} 个字段</p></button>;
}

function StatusContribution({ status }: { status: CardContribution["status"] }) {
  return <Badge variant={status === "pending" ? "warning" : status === "approved" ? "success" : "destructive"}>{status === "pending" ? "待审核" : status === "approved" ? "已通过" : "已拒绝"}</Badge>;
}
