"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, FilePlus2, FileText, MessageSquareWarning, Send, Sprout } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardPreview } from "@/components/cards/card-preview";
import { StatusBadge, statusMap } from "@/components/cards/card-tile";
import { EmptyState } from "@/components/common/empty-state";
import { useDemoStore, useDictionary } from "@/lib/demo-store";
import type { CardStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const filters: Array<{ value: "all" | CardStatus; label: string }> = [
  { value: "all", label: "全部" },
  { value: "draft", label: "草稿" },
  { value: "pending", label: "待审核" },
  { value: "changes_requested", label: "需修改" },
  { value: "published", label: "已发布" },
  { value: "rejected", label: "未通过" },
];

export default function SubmissionsPage() {
  const { state, currentUser } = useDemoStore();
  const dictionary = useDictionary();
  const [filter, setFilter] = useState<"all" | CardStatus>("all");
  if (!currentUser) return null;

  const ownCards = state.cards.filter((card) => card.ownerId === currentUser.id).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  const filtered = filter === "all" ? ownCards : ownCards.filter((card) => card.status === filter);
  const counts = {
    all: ownCards.length,
    draft: ownCards.filter((card) => card.status === "draft").length,
    pending: ownCards.filter((card) => card.status === "pending").length,
    changes: ownCards.filter((card) => card.status === "changes_requested").length,
    published: ownCards.filter((card) => card.status === "published").length,
  };

  return (
    <div>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="label-caps mb-3">My Contributions</p><h1 className="section-title">我的投稿</h1><p className="mt-3 text-sm leading-7 text-muted-foreground">管理草稿、查看审核反馈，并跟踪卡片进入公开档案的进度。</p></div>
        <Button asChild><Link href="/me/submissions/new"><FilePlus2 className="size-4" />新建投稿</Link></Button>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Summary icon={FileText} label="全部记录" value={counts.all} />
        <Summary icon={Send} label="待审核" value={counts.pending} />
        <Summary icon={MessageSquareWarning} label="需要修改" value={counts.changes} />
        <Summary icon={Sprout} label="已发布" value={counts.published} />
      </div>

      <div className="no-scrollbar mt-7 flex gap-2 overflow-x-auto border-b border-border pb-4">
        {filters.map((item) => (
          <button key={item.value} onClick={() => setFilter(item.value)} className={`whitespace-nowrap rounded-pill px-3.5 py-2 text-xs font-semibold transition-colors ${filter === item.value ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground hover:text-foreground"}`}>
            {item.label}{item.value !== "all" && <span className="ml-1.5 opacity-60">{counts[item.value === "changes_requested" ? "changes" : item.value as keyof typeof counts] ?? 0}</span>}
          </button>
        ))}
      </div>

      {filtered.length ? (
        <div className="mt-5 space-y-3">
          {filtered.map((card) => {
            const cover = state.media.find((media) => media.uuid === card.coverMediaId);
            return (
              <article key={card.uuid} className="rounded-card border border-border bg-card p-3 md:p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="w-full shrink-0 sm:w-40"><CardPreview card={card} media={cover} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><StatusBadge status={card.status} />{card.featured && <Badge variant="secondary">精选</Badge>}</div>
                    <Link href={`/me/submissions/${card.uuid}`} className="mt-2 inline-flex items-center gap-1 font-serif text-xl font-bold hover:text-primary">{card.title}<ArrowUpRight className="size-3.5" /></Link>
                    <p className="mt-1 text-xs text-muted-foreground">{[dictionary(card.issuerId), dictionary(card.networkId), card.releaseYear ? String(card.releaseYear) : null].filter(Boolean).join(" · ")}</p>
                    {card.reviewComment && <p className={`mt-2 line-clamp-2 text-xs leading-5 ${card.status === "changes_requested" ? "text-destructive" : "text-muted-foreground"}`}>审核反馈：{card.reviewComment}</p>}
                  </div>
                  <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border/60 pt-3 sm:block sm:border-0 sm:pt-0 sm:text-right">
                    <p className="text-[0.65rem] text-muted-foreground">更新于<br />{formatDate(card.updatedAt)}</p>
                    <Button asChild size="sm" variant="outline" className="mt-0 sm:mt-2"><Link href={`/me/submissions/${card.uuid}`}>{card.status === "draft" ? "继续编辑" : "查看详情"}</Link></Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-5"><EmptyState title={filter === "all" ? "还没有投稿记录" : `没有${statusMap[filter as CardStatus]?.label ?? ""}状态的卡片`} description={filter === "all" ? "从一张你喜欢的银行卡开始，记录它的颜色、材质与设计细节。" : "切换筛选条件，或创建一条新的投稿记录。"} action={<Button asChild><Link href="/me/submissions/new">新建投稿</Link></Button>} /></div>
      )}
    </div>
  );
}

function Summary({ icon: Icon, label, value }: { icon: typeof FileText; label: string; value: number }) {
  return <div className="rounded-ui border border-border bg-card p-4"><Icon className="size-4 text-secondary" /><p className="mt-3 font-serif text-2xl font-bold">{value}</p><p className="text-[0.68rem] text-muted-foreground">{label}</p></div>;
}
