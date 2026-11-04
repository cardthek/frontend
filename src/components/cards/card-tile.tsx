"use client";

import Link from "next/link";
import { ArrowUpRight, LockKeyhole } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CardPreview } from "@/components/cards/card-preview";
import { useAppStore, useDictionary } from "@/lib/app-store";
import type { Card } from "@/lib/types";

export function CardTile({ card, showStatus = false }: { card: Card; showStatus?: boolean }) {
  const { state } = useAppStore();
  const dictionary = useDictionary();
  const cover =
    card.media?.find((item) => item.uuid === card.coverMediaId) ??
    card.media?.[0] ??
    state.media.find((item) => item.uuid === card.coverMediaId);
  const owner =
    card.owner ?? state.users.find((user) => user.id === card.ownerId);
  const canSeeGallery = !card.galleryHidden;
  const meta = [dictionary(card.issuerId), card.releaseYear ? String(card.releaseYear) : null].filter(Boolean).join(" · ");

  return (
    <article className="group min-w-0">
      <CardPreview card={card} media={cover} className="bg-surface">
        {!canSeeGallery && (
          <span className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full bg-background/85 text-muted-foreground backdrop-blur">
            <LockKeyhole className="size-3.5" />
          </span>
        )}
      </CardPreview>
      <div className="mt-3 flex items-start justify-between gap-3 px-1">
        <div className="min-w-0">
          <Link href={`/cards/${card.uuid}`} className="group/title inline-flex items-center gap-1.5">
            <h3 className="truncate font-serif text-lg font-bold group-hover/title:text-primary">{card.title}</h3>
            <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {meta}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {showStatus && <StatusBadge status={card.status} />}
          {!showStatus && card.featured && <Badge variant="secondary">精选</Badge>}
        </div>
      </div>
      <p className="mt-2 px-1 text-[0.68rem] text-muted-foreground">由 {owner?.displayName ?? "unknown"} 整理</p>
    </article>
  );
}

const statusMap: Record<Card["status"], { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" | "outline" }> = {
  draft: { label: "草稿", variant: "outline" },
  pending: { label: "待审核", variant: "warning" },
  changes_requested: { label: "需修改", variant: "destructive" },
  published: { label: "已发布", variant: "success" },
  rejected: { label: "未通过", variant: "destructive" },
  hidden: { label: "已隐藏", variant: "outline" },
};

export function StatusBadge({ status }: { status: Card["status"] }) {
  const item = statusMap[status];
  return <Badge variant={item.variant}>{item.label}</Badge>;
}

export { statusMap };
