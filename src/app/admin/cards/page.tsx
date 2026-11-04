"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Pencil, Plus, Search, Sparkles, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AuthGuard } from "@/components/auth/auth-guard";
import { CardPreview } from "@/components/cards/card-preview";
import { StatusBadge, statusMap } from "@/components/cards/card-tile";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeading } from "@/components/common/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAppStore, useDictionary } from "@/lib/app-store";
import { countryName } from "@/data/countries";
import type { CardStatus } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

const statusOptions: Array<CardStatus | "all"> = ["all", "published", "pending", "draft", "changes_requested", "rejected", "hidden"];

export default function AdminCardsPage() {
  return (
    <AuthGuard permission="cards.read">
      <CardManagement />
    </AuthGuard>
  );
}

function CardManagement() {
  const { state, can, setCardStatus, toggleFeatured, deleteCard } = useAppStore();
  const dictionary = useDictionary();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<CardStatus | "all">("all");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const cards = useMemo(() => state.cards.filter((card) => {
    const haystack = `${card.title} ${dictionary(card.issuerId)} ${dictionary(card.networkId)} ${card.tags.join(" ")}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase()) && (status === "all" || card.status === status) && (!featuredOnly || card.featured);
  }), [dictionary, featuredOnly, query, state.cards, status]);

  async function changeStatus(uuid: string, next: "published" | "hidden") {
    try {
      await setCardStatus(uuid, next);
      toast.success(next === "published" ? "卡片已发布" : "卡片已隐藏");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "卡片状态更新失败");
    }
  }

  async function remove(uuid: string, title: string) {
    if (!window.confirm(`确定删除「${title}」吗？媒体文件不会被自动删除。`)) return;
    try {
      await deleteCard(uuid);
      toast.success("卡片已删除");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "卡片删除失败");
    }
  }

  return (
    <div>
      <PageHeading eyebrow="Content Library" title="卡片管理" description="维护公开档案的发布状态、首页精选与内容清理。卡片状态变更会立即反映到公开站。" actions={<><Badge variant="outline">{state.cards.length} 条记录</Badge>{can("cards.create") && <Button asChild><Link href="/admin/cards/new"><Plus className="size-4" />新增卡片</Link></Button>}</>} />

      <div className="mt-7 flex flex-col gap-3 rounded-card border border-border bg-surface/55 p-3 sm:flex-row sm:items-center">
        <label className="relative min-w-0 flex-1"><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索标题、发行方、卡组织或标签" className="bg-card pl-10" /></label>
        <Select value={status} onChange={(event) => setStatus(event.target.value as CardStatus | "all")} className="bg-card sm:w-40">{statusOptions.map((item) => <option key={item} value={item}>{item === "all" ? "全部状态" : statusMap[item].label}</option>)}</Select>
        <button onClick={() => setFeaturedOnly((value) => !value)} className={cn("flex h-11 items-center justify-center gap-2 rounded-pill border px-4 text-xs font-semibold transition-colors", featuredOnly ? "border-secondary bg-secondary text-secondary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground")}><Star className="size-3.5" />只看精选</button>
      </div>

      {cards.length ? (
        <div className="mt-5 space-y-2">
          {cards.map((card) => {
            const cover = card.media?.find((asset) => asset.uuid === card.coverMediaId) ?? card.media?.[0] ?? state.media.find((asset) => asset.uuid === card.coverMediaId);
            const owner = state.users.find((user) => user.id === card.ownerId);
            const meta = [
              dictionary(card.issuerId),
              dictionary(card.networkId),
              card.bin ? `BIN ${card.bin}` : null,
              card.countryCode ? countryName(card.countryCode) : null,
              card.currencyCodes?.length ? card.currencyCodes.map((code) => code === "*" ? "全币种" : code).join(" / ") : null,
              card.releaseYear ? String(card.releaseYear) : null,
            ].filter(Boolean).join(" · ");
            return (
              <article key={card.uuid} className="rounded-card border border-border bg-card p-3 md:p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                  <div className="w-full shrink-0 sm:w-36"><CardPreview card={card} media={cover} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><StatusBadge status={card.status} />{card.featured && <Badge variant="secondary"><Sparkles className="size-3" />首页精选</Badge>}</div>
                    <h2 className="mt-2 truncate font-serif text-xl font-bold">{card.title}</h2>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{meta}</p>
                    <p className="mt-2 text-[0.65rem] text-muted-foreground">投稿者 {owner?.displayName ?? "未知"} · 更新于 {formatDate(card.updatedAt, true)} · <span className="font-mono">{card.uuid.slice(0, 8)}</span></p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 border-t border-border/70 pt-3 xl:justify-end xl:border-l xl:border-t-0 xl:pl-4 xl:pt-0">
                    {can("cards.update") && <Button asChild variant="outline" size="sm"><Link href={`/admin/cards/${card.uuid}/edit`}><Pencil className="size-4" />编辑</Link></Button>}
                    <Button asChild variant="ghost" size="sm"><Link href={`/cards/${card.uuid}`}><Eye className="size-4" />查看</Link></Button>
                    {can("cards.publish") && card.status !== "published" && <Button variant="outline" size="sm" onClick={() => void changeStatus(card.uuid, "published")}><Eye className="size-4" />发布</Button>}
                    {can("cards.publish") && card.status === "published" && <Button variant="outline" size="sm" onClick={() => void changeStatus(card.uuid, "hidden")}><EyeOff className="size-4" />隐藏</Button>}
                    {can("cards.update") && <Button variant={card.featured ? "secondary" : "ghost"} size="sm" onClick={async () => { try { await toggleFeatured(card.uuid); toast.success(card.featured ? "已取消精选" : "已设为精选"); } catch (error) { toast.error(error instanceof Error ? error.message : "精选状态更新失败"); } }}><Star className="size-4" />{card.featured ? "取消精选" : "设为精选"}</Button>}
                    {can("cards.update") && <Button variant="ghost" size="icon" onClick={() => void remove(card.uuid, card.title)} aria-label="删除卡片" className="text-destructive hover:bg-destructive/10"><Trash2 className="size-4" /></Button>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-5"><EmptyState title="没有匹配的卡片" description="尝试清除搜索词或切换状态筛选。" action={<Button variant="outline" onClick={() => { setQuery(""); setStatus("all"); setFeaturedOnly(false); }}>重置筛选</Button>} /></div>
      )}
    </div>
  );
}
