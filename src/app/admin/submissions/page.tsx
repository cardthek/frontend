"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Clock3, ExternalLink, Pencil, Search } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { CardPreview } from "@/components/cards/card-preview";
import { StatusBadge } from "@/components/cards/card-tile";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeading } from "@/components/common/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDemoStore, useDictionary } from "@/lib/demo-store";
import type { CardStatus } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

const filters: Array<{ value: "all" | CardStatus; label: string }> = [
  { value: "pending", label: "待审核" },
  { value: "changes_requested", label: "需修改" },
  { value: "published", label: "已通过" },
  { value: "rejected", label: "未通过" },
  { value: "all", label: "全部" },
];

export default function AdminSubmissionsPage() {
  return <AuthGuard permission="submissions.read"><ReviewQueue /></AuthGuard>;
}

function ReviewQueue() {
  const { state, can } = useDemoStore();
  const dictionary = useDictionary();
  const [filter, setFilter] = useState<"all" | CardStatus>("pending");
  const [query, setQuery] = useState("");
  const pending = state.cards.filter((card) => card.status === "pending");
  const cards = useMemo(() => state.cards.filter((card) => {
    const haystack = `${card.title} ${dictionary(card.issuerId)} ${dictionary(card.networkId)}`.toLowerCase();
    return (filter === "all" || card.status === filter) && haystack.includes(query.trim().toLowerCase());
  }), [dictionary, filter, query, state.cards]);

  return (
    <div>
      <PageHeading
        eyebrow="Review Workflow"
        title="投稿审核"
        description="审核队列与审核编辑分开处理。点击记录进入独立编辑页，修改资料后保存或直接通过。"
        actions={<Badge variant={pending.length ? "warning" : "success"}><Clock3 className="size-3" />{pending.length} 条待处理</Badge>}
      />

      <div className="mt-7 flex flex-col gap-3 rounded-card border border-border bg-surface/55 p-3 lg:flex-row lg:items-center">
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {filters.map((item) => {
            const count = item.value === "all" ? state.cards.length : state.cards.filter((card) => card.status === item.value).length;
            return <button key={item.value} onClick={() => setFilter(item.value)} className={cn("whitespace-nowrap rounded-pill px-3.5 py-2 text-[0.68rem] font-semibold transition-colors", filter === item.value ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground")}>{item.label} <span className="opacity-60">{count}</span></button>;
          })}
        </div>
        <label className="relative min-w-0 flex-1 lg:ml-auto lg:max-w-sm"><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索标题、发行方或卡组织" className="bg-card pl-10" /></label>
      </div>

      {cards.length ? (
        <div className="mt-5 grid gap-3 xl:grid-cols-2">
          {cards.map((card) => {
            const cover = state.media.find((asset) => asset.uuid === card.coverMediaId);
            const owner = state.users.find((user) => user.id === card.ownerId);
            const canReview = can("submissions.review") && card.status === "pending";
            return (
              <article key={card.uuid} className="rounded-card border border-border bg-card p-3 md:p-4">
                <div className="flex gap-4">
                  <div className="w-28 shrink-0 sm:w-36"><CardPreview card={card} media={cover} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><StatusBadge status={card.status} />{card.featured && <Badge variant="secondary">精选</Badge>}</div>
                    <h2 className="mt-2 truncate font-serif text-xl font-bold">{card.title}</h2>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{[dictionary(card.issuerId), dictionary(card.networkId), card.releaseYear ? String(card.releaseYear) : null].filter(Boolean).join(" · ")}</p>
                    <p className="mt-2 truncate text-[0.65rem] text-muted-foreground">投稿者 {owner?.displayName ?? "未知用户"} · {formatDate(card.submittedAt ?? card.updatedAt, true)}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {canReview ? <Button asChild size="sm"><Link href={`/admin/submissions/${card.uuid}/edit`}><Pencil className="size-4" />进入审核编辑</Link></Button> : <Button asChild variant="outline" size="sm"><Link href={`/admin/cards/${card.uuid}/edit`}><Pencil className="size-4" />编辑卡片</Link></Button>}
                      {card.status === "published" && <Button asChild variant="ghost" size="sm"><Link href={`/cards/${card.uuid}`}><ExternalLink className="size-4" />公开页</Link></Button>}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-5"><EmptyState title="没有匹配的投稿" description="切换筛选条件，或清除搜索词后重试。" /></div>
      )}
    </div>
  );
}
