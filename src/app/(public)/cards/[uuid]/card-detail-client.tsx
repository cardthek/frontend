"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, ExternalLink, EyeOff, Heart, Leaf, LockKeyhole, MessageSquarePlus, ShieldCheck, Tag } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardDownloadButton } from "@/components/cards/card-download-button";
import { CardPreview } from "@/components/cards/card-preview";
import { CardTile, StatusBadge } from "@/components/cards/card-tile";
import { useDemoStore, useDictionary, visibilityLabel } from "@/lib/demo-store";
import { countryName } from "@/data/countries";
import { currencyName } from "@/data/currencies";
import { formatDate } from "@/lib/utils";

export function CardDetailClient({ uuid }: { uuid: string }) {
  const { state, currentUser, can, isFieldVisible, isProfileVisible, toggleLike } = useDemoStore();
  const dictionary = useDictionary();
  const card = state.cards.find((item) => item.uuid === uuid);
  const [activeMediaId, setActiveMediaId] = useState(card?.coverMediaId ?? card?.mediaIds[0]);

  if (!card) {
    return (
      <div className="container-page py-24 text-center">
        <Leaf className="mx-auto size-8 text-secondary" />
        <h1 className="mt-5 font-serif text-3xl font-bold">卡片不存在</h1>
        <p className="mt-3 text-sm text-muted-foreground">它可能已经被移除，或链接地址有误。</p>
        <Button asChild className="mt-6"><Link href="/cards">返回卡面档案</Link></Button>
      </div>
    );
  }

  const owner = state.users.find((user) => user.id === card.ownerId);
  const contributors = [owner, ...(card.contributorIds ?? []).map((id) => state.users.find((user) => user.id === id))]
    .filter((user, index, users): user is NonNullable<typeof owner> => Boolean(user) && users.findIndex((candidate) => candidate?.id === user?.id) === index);
  const liked = Boolean(currentUser && card.likedByUserIds?.includes(currentUser.id));
  const privileged = can("cards.update") || can("submissions.review") || currentUser?.id === card.ownerId;
  const isPublic = card.status === "published";
  const canContribute = Boolean(isPublic && currentUser && currentUser.id !== card.ownerId);
  const activeMedia = state.media.find((item) => item.uuid === activeMediaId) ?? state.media.find((item) => item.uuid === card.coverMediaId);
  const galleryVisible = isFieldVisible(card, "gallery");
  const related = state.cards.filter((item) => item.status === "published" && item.uuid !== card.uuid && (item.networkId === card.networkId || item.tags.some((tag) => card.tags.includes(tag)))).slice(0, 3);
  const hasDescription = Boolean(card.description?.trim());
  const hasBin = Boolean(card.bin);
  const hasCurrency = Boolean(card.currencyCodes?.length);
  const fieldHasValue = {
    issuer: true,
    bin: hasBin,
    network: true,
    cardType: true,
    level: Boolean(card.levelId),
    country: Boolean(card.countryCode),
    currency: hasCurrency,
    releaseYear: card.releaseYear !== undefined,
    tags: card.tags.length > 0,
    description: hasDescription,
    source: Boolean(card.sourceUrl),
  };
  const hiddenFields = (["issuer", "bin", "network", "cardType", "level", "country", "currency", "releaseYear", "tags", "description", "source"] as const).filter((field) => fieldHasValue[field] && !isFieldVisible(card, field));

  function likeCard() {
    const result = toggleLike(card!.uuid);
    if (!result.ok) return toast.error(result.message);
    toast.success(result.message);
  }

  if (!isPublic && !privileged) {
    return (
      <div className="container-page py-24 text-center">
        <EyeOff className="mx-auto size-8 text-muted-foreground" />
        <h1 className="mt-5 font-serif text-3xl font-bold">这张卡片尚未公开</h1>
        <p className="mt-3 text-sm text-muted-foreground">它可能还在审核、修改或草稿状态。</p>
        <Button asChild className="mt-6"><Link href="/cards">浏览公开卡片</Link></Button>
      </div>
    );
  }

  return (
    <div className="container-page py-8 md:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="px-0"><Link href="/cards"><ArrowLeft className="size-4" />返回档案</Link></Button>
        {!isPublic && <StatusBadge status={card.status} />}
      </div>

      <div className="mt-5 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
        <div>
          <div className="relative rounded-card border border-border bg-surface p-4 md:p-7">
            <CardPreview card={card} media={activeMedia} showDownload className="mx-auto w-full max-w-2xl" />
            {activeMedia && <CardDownloadButton card={card} media={activeMedia} className="absolute bottom-5 right-5 z-10" />}
          </div>
          {galleryVisible && card.mediaIds.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {card.mediaIds.map((mediaId) => {
                const media = state.media.find((item) => item.uuid === mediaId);
                if (!media) return null;
                return (
                  <div key={mediaId} className={`relative rounded-ui border bg-transparent p-1 transition-colors ${activeMediaId === mediaId ? "border-primary" : "border-border"}`}>
                    <CardPreview card={card} media={media} showLightbox={false} onActivate={() => setActiveMediaId(mediaId)} />
                    <CardDownloadButton card={card} media={media} compact className="absolute bottom-2 right-2 z-10" />
                  </div>
                );
              })}
            </div>
          )}
          {!galleryVisible && (
            <div className="mt-4 flex items-center gap-3 rounded-ui border border-border bg-surface px-4 py-3 text-sm text-muted-foreground">
              <LockKeyhole className="size-4" />该卡片图库仅对特定身份开放。
            </div>
          )}
        </div>

        <aside className="lg:pt-3">
          <p className="label-caps mb-3">Card Record{card.releaseYear !== undefined ? ` · ${card.releaseYear}` : ""}</p>
          <div className="flex items-start justify-between gap-4">
            <h1 className="font-serif text-4xl font-bold leading-tight md:text-5xl">{card.title}</h1>
            {card.featured && <Badge variant="secondary">精选</Badge>}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button type="button" variant={liked ? "secondary" : "outline"} size="sm" onClick={likeCard}>
              <Heart className={liked ? "size-4 fill-current" : "size-4"} />
              {card.likeCount ?? 0}
            </Button>
            <span className="inline-flex h-9 items-center gap-2 rounded-pill border border-border bg-card px-4 text-xs font-semibold text-muted-foreground">
              <Download className="size-3.5" />
              {card.downloadCount ?? 0}
            </span>
            {canContribute && <Button asChild variant="outline" size="sm"><Link href={`/cards/${card.uuid}/contribute`}><MessageSquarePlus className="size-4" />补充或纠错</Link></Button>}
          </div>
          {hasDescription && <p className="mt-5 text-base leading-8 text-muted-foreground">{isFieldVisible(card, "description") ? card.description : "这张卡片的介绍仅对特定身份开放。"}</p>}

          <div className="mt-7 flex flex-wrap gap-2">
            {isFieldVisible(card, "tags") && card.tags.map((tag) => <Badge key={tag} variant="outline"><Tag className="size-3" />{tag}</Badge>)}
          </div>

          <dl className="mt-8 divide-y divide-border/70 border-y border-border/70">
            {isFieldVisible(card, "issuer") && <InfoRow label="发行方" value={dictionary(card.issuerId)} />}
            {hasBin && isFieldVisible(card, "bin") && <InfoRow label="卡 BIN" value={card.bin!} />}
            {isFieldVisible(card, "network") && <InfoRow label="卡组织" value={dictionary(card.networkId)} />}
            {isFieldVisible(card, "cardType") && <InfoRow label="卡片类型" value={dictionary(card.cardTypeId)} />}
            {card.levelId && isFieldVisible(card, "level") && <InfoRow label="等级" value={dictionary(card.levelId)} />}
            {card.countryCode && isFieldVisible(card, "country") && <InfoRow label="发行国家 / 地区" value={`${countryName(card.countryCode)} · ${card.countryCode}`} />}
            {hasCurrency && isFieldVisible(card, "currency") && <InfoRow label="币种" value={card.currencyCodes!.map((code) => code === "*" ? "全币种" : `${currencyName(code)} · ${code}`).join("、")} />}
            {card.releaseYear !== undefined && isFieldVisible(card, "releaseYear") && <InfoRow label="发行年份" value={String(card.releaseYear)} />}
            <InfoRow label="录入时间" value={formatDate(card.createdAt)} />
          </dl>

          {isFieldVisible(card, "source") && card.sourceUrl && (
            <a href={card.sourceUrl} target="_blank" rel="noreferrer" className="mt-5 flex items-center justify-between rounded-ui border border-border bg-surface px-4 py-3 text-sm font-semibold hover:bg-surface-muted">
              查看资料来源 <ExternalLink className="size-4 text-muted-foreground" />
            </a>
          )}
          {!isFieldVisible(card, "source") && card.sourceUrl && (
            <p className="mt-5 flex items-center gap-2 rounded-ui bg-surface px-4 py-3 text-xs text-muted-foreground"><LockKeyhole className="size-3.5" />来源链接需要登录后查看</p>
          )}

          {hiddenFields.length > 0 && (
            <p className="mt-4 text-[0.68rem] leading-5 text-muted-foreground">有 {hiddenFields.length} 个字段受可见性规则保护：{hiddenFields.map((field) => ({ issuer: "发行方", bin: "卡 BIN", network: "卡组织", cardType: "类型", level: "等级", country: "国家/地区", currency: "币种", releaseYear: "年份", tags: "标签", description: "介绍", source: "来源" })[field]).join("、")}</p>
          )}

          {contributors.length > 0 && (
            <div className="mt-8 rounded-card border border-border bg-card p-4">
              <p className="label-caps mb-3">档案贡献者</p>
              <div className="space-y-3">
                {contributors.map((contributor) => {
                  const contributorDeleted = contributor.status === "deleted";
                  return (
                    <div key={contributor.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={contributor.displayName} tone={contributor.avatarTone} />
                        <div><p className="font-semibold">{contributor.displayName}</p>{!contributorDeleted && <p className="text-xs text-muted-foreground">@{contributor.username}</p>}</div>
                      </div>
                      {isProfileVisible(contributor) && <Button asChild variant="ghost" size="sm"><Link href={`/u/${contributor.slug}`}>主页</Link></Button>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {privileged && (
            <div className="mt-4 rounded-ui border border-dashed border-border p-4">
              <p className="flex items-center gap-2 text-xs font-semibold"><ShieldCheck className="size-4 text-secondary" />管理视角</p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">你可以看到全部字段。当前字段可见范围：{visibilityLabel(card.visibilityOverrides.description ?? state.settings.fieldDefaults.description, state.roles)}。</p>
              <div className="mt-3 flex gap-2">
                {owner?.id === currentUser?.id && <Button asChild size="sm" variant="outline"><Link href={`/me/submissions/${card.uuid}`}>编辑投稿</Link></Button>}
                {can("submissions.review") && card.status === "pending" && <Button asChild size="sm"><Link href="/admin/submissions">前往审核</Link></Button>}
              </div>
            </div>
          )}
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-20 border-t border-border pt-12">
          <p className="label-caps mb-3">Related Cards</p>
          <h2 className="section-title">相似设计</h2>
          <div className="mt-7 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => <CardTile key={item.uuid} card={item} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-5 py-3.5 text-sm"><dt className="text-muted-foreground">{label}</dt><dd className="font-semibold">{value}</dd></div>;
}
