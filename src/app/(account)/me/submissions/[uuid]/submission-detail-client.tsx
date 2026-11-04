"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Eye, MessageSquareText, Pencil, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardPreview } from "@/components/cards/card-preview";
import { StatusBadge } from "@/components/cards/card-tile";
import { useDemoStore, useDictionary, visibilityLabel } from "@/lib/demo-store";
import { countryName } from "@/data/countries";
import { currencyName } from "@/data/currencies";
import { formatDate } from "@/lib/utils";

export function SubmissionDetailClient({ uuid }: { uuid: string }) {
  const router = useRouter();
  const { state, currentUser, can, submitCard, deleteCard } = useDemoStore();
  const dictionary = useDictionary();
  const card = state.cards.find((item) => item.uuid === uuid);

  if (!card) {
    return <div className="py-20 text-center"><h1 className="font-serif text-3xl font-bold">投稿不存在</h1><Button asChild className="mt-6"><Link href="/me/submissions">返回投稿列表</Link></Button></div>;
  }

  const isOwner = currentUser?.id === card.ownerId;
  if (!isOwner && !can("cards.update") && !can("submissions.review")) {
    return <div className="py-20 text-center"><h1 className="font-serif text-3xl font-bold">无权查看这条投稿</h1><Button asChild className="mt-6"><Link href="/me/submissions">返回投稿列表</Link></Button></div>;
  }

  const cover = state.media.find((media) => media.uuid === card.coverMediaId);
  const reviews = state.reviews.filter((review) => review.cardUuid === card.uuid);
  const canEdit = (isOwner && can("submissions.updateOwn")) || can("cards.update");
  const canSubmit = isOwner && ["draft", "changes_requested", "rejected", "hidden"].includes(card.status);
  const canBypassReview = can("submissions.bypassReview");

  function submit() {
    submitCard(card!.uuid);
    toast.success(canBypassReview ? "投稿已自动发布" : "已重新提交审核");
  }

  function remove() {
    if (!window.confirm("确定删除这条演示投稿吗？此操作无法撤销。")) return;
    deleteCard(card!.uuid);
    toast.success("投稿已删除");
    router.push("/me/submissions");
  }

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-5 px-0"><Link href="/me/submissions"><ArrowLeft className="size-4" />返回我的投稿</Link></Button>
      <div className="flex flex-col gap-5 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div><div className="flex flex-wrap items-center gap-2"><StatusBadge status={card.status} />{card.featured && <Badge variant="secondary">精选</Badge>}</div><h1 className="mt-3 font-serif text-3xl font-bold md:text-4xl">{card.title}</h1><p className="mt-2 text-sm text-muted-foreground">投稿编号 <span className="font-mono text-xs">{card.uuid}</span></p></div>
        <div className="flex flex-wrap gap-2">
          {card.status === "published" && <Button asChild variant="outline"><Link href={`/cards/${card.uuid}`}><Eye className="size-4" />公开页面</Link></Button>}
          {canEdit && <Button asChild variant="outline"><Link href={`/me/submissions/${card.uuid}/edit`}><Pencil className="size-4" />编辑资料</Link></Button>}
          {canSubmit && <Button onClick={submit}><Send className="size-4" />{canBypassReview ? "立即发布" : "提交审核"}</Button>}
        </div>
      </div>

      {card.status === "changes_requested" && card.reviewComment && (
        <div className="mt-5 rounded-ui border border-destructive/25 bg-destructive/8 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-destructive"><MessageSquareText className="size-4" />需要修改</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.reviewComment}</p>
        </div>
      )}

      <div className="mt-7 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="rounded-card border border-border bg-surface p-4 md:p-6"><CardPreview card={card} media={cover} /></div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-ui border border-border bg-card p-3"><p className="font-serif text-xl font-bold">{card.mediaIds.length}</p><p className="mt-1 text-[0.65rem] text-muted-foreground">图片</p></div>
            <div className="rounded-ui border border-border bg-card p-3"><p className="font-serif text-xl font-bold">{card.tags.length}</p><p className="mt-1 text-[0.65rem] text-muted-foreground">标签</p></div>
            <div className="rounded-ui border border-border bg-card p-3"><p className="font-serif text-xl font-bold">{reviews.length}</p><p className="mt-1 text-[0.65rem] text-muted-foreground">审核记录</p></div>
          </div>
        </div>
        <div>
          <div className="rounded-card border border-border bg-card p-5">
            <p className="label-caps">Submission Data</p>
            <dl className="mt-4 divide-y divide-border/70">
              <Row label="发行方" value={dictionary(card.issuerId)} />
              {card.bin && <Row label="卡 BIN" value={card.bin} />}
              <Row label="卡组织" value={dictionary(card.networkId)} />
              <Row label="卡片类型" value={dictionary(card.cardTypeId)} />
              {card.levelId && <Row label="卡片等级" value={dictionary(card.levelId)} />}
              {card.countryCode && <Row label="发行国家 / 地区" value={`${countryName(card.countryCode)} · ${card.countryCode}`} />}
              {card.releaseYear !== undefined && <Row label="发行年份" value={String(card.releaseYear)} />}
              {card.currencyCodes?.length ? <Row label="币种" value={card.currencyCodes.map((code) => code === "*" ? "全币种" : `${currencyName(code)} · ${code}`).join("、")} /> : null}
              <Row label="创建时间" value={formatDate(card.createdAt, true)} icon={<CalendarDays className="size-3.5" />} />
              <Row label="最近更新" value={formatDate(card.updatedAt, true)} />
            </dl>
            {card.description && <p className="mt-5 border-t border-border/70 pt-4 text-sm leading-7 text-muted-foreground">{card.description}</p>}
            <div className="mt-4 flex flex-wrap gap-2">{card.tags.map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}</div>
          </div>

          <div className="mt-4 rounded-card border border-border bg-card p-5">
            <p className="label-caps">Visibility</p>
            <p className="mt-3 text-sm font-semibold">介绍字段：{visibilityLabel(card.visibilityOverrides.description ?? state.settings.fieldDefaults.description, state.roles)}</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">拥有字段可见性权限的用户组可在编辑页调整完整字段规则。作者与管理员始终可以看到自己的全部资料。</p>
          </div>

          {reviews.length > 0 && (
            <div className="mt-4 rounded-card border border-border bg-card p-5">
              <p className="label-caps">Review History</p>
              <div className="mt-4 space-y-4">
                {reviews.map((review) => {
                  const reviewer = state.users.find((user) => user.id === review.reviewerId);
                  return <div key={review.id} className="border-l-2 border-secondary/40 pl-3"><p className="text-xs font-semibold">{review.decision === "approved" ? "审核通过" : review.decision === "rejected" ? "审核拒绝" : "要求修改"} · {reviewer?.displayName ?? "审核员"}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{review.comment}</p><p className="mt-1 text-[0.62rem] text-muted-foreground">{formatDate(review.createdAt, true)}</p></div>;
                })}
              </div>
            </div>
          )}

          {isOwner && ["draft", "rejected", "changes_requested"].includes(card.status) && (
            <Button variant="ghost" className="mt-4 text-destructive hover:bg-destructive/10" onClick={remove}><Trash2 className="size-4" />删除这条投稿</Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-4 py-2.5 text-sm"><dt className="flex items-center gap-1.5 text-muted-foreground">{icon}{label}</dt><dd className="text-right font-semibold">{value}</dd></div>;
}
